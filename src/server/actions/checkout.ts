"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { quoteCart, MAX_PER_LINE, type CartProblem } from "@/server/checkout/pricing";
import { sandboxSessionId, stripe, stripeMode } from "@/server/stripe";

const linesSchema = z
  .array(z.object({ variantId: z.string().cuid(), quantity: z.number().int().min(1).max(MAX_PER_LINE) }))
  .min(1)
  .max(50);

export type StartCheckoutResult =
  | { ok: true; url: string }
  | { ok: false; error: "invalid" | "cart_changed" | "payment_unavailable"; problems?: CartProblem[] };

/** The site's own origin, for Stripe's return URLs. Prefer the request's host so previews work. */
async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : env.NEXT_PUBLIC_APP_URL;
}

/**
 * Start checkout: re-price the cart from the database, save a PENDING order
 * with a snapshot of every line, then hand the customer to Stripe (or to the
 * sandbox page). Stock is only taken when the payment webhook arrives.
 */
export async function startCheckout(input: unknown): Promise<StartCheckoutResult> {
  const parsed = linesSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const variants = await db.productVariant.findMany({
    where: { id: { in: parsed.data.map((l) => l.variantId) } },
    select: {
      id: true, size: true, color: true, stockQuantity: true, priceOverride: true, images: true,
      product: { select: { name: true, slug: true, basePrice: true, isActive: true } },
    },
  });
  const quote = quoteCart(parsed.data, variants.map((v) => ({ ...v, image: v.images[0] ?? null })));
  if (!quote.ok) return { ok: false, error: "cart_changed", problems: quote.problems };

  const session = await auth();
  const order = await db.order.create({
    data: {
      userId: session?.user.id ?? null,
      // Guests: Stripe (or the sandbox form) collects the email; the webhook fills it in.
      email: session?.user.email ?? "",
      subtotalAmount: quote.subtotal,
      shippingAmount: quote.shipping,
      totalAmount: quote.total,
      items: {
        create: quote.lines.map((l) => ({
          variantId: l.variantId, productName: l.productName, size: l.size, color: l.color, unitPrice: l.unitPrice, quantity: l.quantity,
        })),
      },
    },
    select: { id: true },
  });

  const base = await origin();
  if (stripeMode === "sandbox") {
    await db.order.update({ where: { id: order.id }, data: { stripeCheckoutId: sandboxSessionId(order.id) } });
    return { ok: true, url: `${base}/checkout/sandbox?order=${order.id}` };
  }

  try {
    const checkout = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        payment_intent_data: { metadata: { orderId: order.id } },
        customer_email: session?.user.email ?? undefined,
        shipping_address_collection: { allowed_countries: ["US", "CA", "GB"] },
        line_items: quote.lines.map((l) => ({
          quantity: l.quantity,
          price_data: {
            currency: "usd",
            unit_amount: l.unitPrice,
            product_data: { name: l.productName, description: `${l.color} · ${l.size}`, ...(l.image?.startsWith("https://") ? { images: [l.image] } : {}) },
          },
        })),
        shipping_options: [
          { shipping_rate_data: { type: "fixed_amount", display_name: `${quote.shippingLabel} shipping`, fixed_amount: { amount: quote.shipping, currency: "usd" } } },
        ],
        success_url: `${base}/checkout/success?order=${order.id}`,
        cancel_url: `${base}/checkout/cancelled?order=${order.id}`,
        expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      },
      // The order id makes a retried request return the same session instead of a second one.
      { idempotencyKey: `checkout-${order.id}` },
    );
    await db.order.update({ where: { id: order.id }, data: { stripeCheckoutId: checkout.id } });
    if (!checkout.url) throw new Error("Stripe returned no checkout URL");
    return { ok: true, url: checkout.url };
  } catch (err) {
    console.error("[checkout] could not create the Stripe session", err);
    await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    return { ok: false, error: "payment_unavailable" };
  }
}
