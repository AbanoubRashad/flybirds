"use server";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { sandboxPaymentIntentId, sandboxSessionId, stripe, stripeMode, webhookSecret } from "@/server/stripe";

const schema = z.object({
  order: z.string().cuid(),
  outcome: z.enum(["pay", "cancel"]),
  email: z.string().trim().toLowerCase().email().max(200),
  name: z.string().trim().min(2).max(120),
  line1: z.string().trim().min(3).max(200),
  city: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.enum(["US", "CA", "GB"]),
});

/**
 * Sandbox stand-in for Stripe's hosted page. It does not touch the order
 * itself: it builds the event Stripe would send, signs it with the webhook
 * secret and posts it to the real webhook route. Disabled in live mode.
 */
export async function submitSandboxPayment(form: FormData) {
  if (stripeMode !== "sandbox") notFound();
  const raw = Object.fromEntries(form);
  const orderId = z.string().cuid().safeParse(raw.order);
  if (!orderId.success) notFound();
  const outcome = raw.outcome === "cancel" ? "cancel" : "pay";
  const parsed = schema.safeParse({ ...raw, outcome });
  if (outcome === "pay" && !parsed.success) redirect(`/checkout/sandbox?order=${orderId.data}&error=details`);

  const order = await db.order.findUnique({ where: { id: orderId.data }, select: { id: true, totalAmount: true, currency: true, status: true, stripeCheckoutId: true } });
  if (!order || order.stripeCheckoutId !== sandboxSessionId(order.id)) notFound();

  const d = parsed.success ? parsed.data : null;
  const address = d ? { line1: d.line1, line2: null, city: d.city, state: null, postal_code: d.postalCode, country: d.country } : null;
  const event = {
    id: `evt_sandbox_${order.id}_${outcome}`,
    object: "event",
    api_version: "2025-01-27.acacia",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    type: outcome === "pay" ? "checkout.session.completed" : "checkout.session.expired",
    data: {
      object: {
        id: sandboxSessionId(order.id),
        object: "checkout.session",
        client_reference_id: order.id,
        metadata: { orderId: order.id },
        mode: "payment",
        status: outcome === "pay" ? "complete" : "expired",
        payment_status: outcome === "pay" ? "paid" : "unpaid",
        amount_total: order.totalAmount,
        currency: order.currency,
        payment_intent: outcome === "pay" ? sandboxPaymentIntentId(order.id) : null,
        customer_details: d ? { email: d.email, name: d.name, address } : null,
        collected_information: d ? { shipping_details: { name: d.name, address } } : null,
      },
    },
  };
  const payload = JSON.stringify(event);
  const signature = stripe().webhooks.generateTestHeaderString({ payload, secret: webhookSecret() });

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  const base = host ? `${proto}://${host}` : env.NEXT_PUBLIC_APP_URL;
  const res = await fetch(`${base}/api/webhooks/stripe`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": signature },
    body: payload,
    cache: "no-store",
  });
  if (!res.ok) redirect(`/checkout/sandbox?order=${order.id}&error=webhook`);
  redirect(outcome === "pay" ? `/checkout/success?order=${order.id}` : `/checkout/cancelled?order=${order.id}`);
}
