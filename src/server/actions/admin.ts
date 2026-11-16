"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/auth";
import { db } from "@/lib/db";
import { cancelPendingOrder, markOrderRefunded, markOrderShipped } from "@/server/orders";
import { stripe, stripeMode } from "@/server/stripe";

/**
 * Admin writes. Middleware already gates /admin; every action re-checks the
 * role itself, because Server Actions can be called directly.
 */
const id = z.string().cuid();

function refresh() {
  revalidatePath("/admin", "layout");
}

export type AdminActionState = { ok: boolean; message: string } | null;

const orderAction = z.object({ order: id, action: z.enum(["ship", "refund", "cancel"]) });

/** Order status overrides: PAID → SHIPPED, PAID/SHIPPED → REFUNDED (money back + restock), PENDING → CANCELLED. */
export async function updateOrderStatus(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = orderAction.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "That request was not valid." };
  const { order: orderId, action } = parsed.data;

  if (action === "ship") {
    const r = await markOrderShipped(orderId);
    refresh();
    return r.changed ? { ok: true, message: "Marked as shipped." } : { ok: false, message: `Only paid orders can be shipped (this one is ${r.status?.toLowerCase() ?? "missing"}).` };
  }

  if (action === "cancel") {
    const r = await cancelPendingOrder(orderId);
    refresh();
    return r.changed ? { ok: true, message: "Order cancelled." } : { ok: false, message: `Only unpaid orders can be cancelled (this one is ${r.status?.toLowerCase() ?? "missing"}).` };
  }

  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true, stripePaymentIntentId: true } });
  if (!order || (order.status !== "PAID" && order.status !== "SHIPPED")) {
    return { ok: false, message: "Only paid or shipped orders can be refunded." };
  }
  if (stripeMode === "live") {
    if (!order.stripePaymentIntentId) return { ok: false, message: "This order has no Stripe payment to refund." };
    try {
      // The order id as idempotency key: a double click refunds once.
      await stripe().refunds.create({ payment_intent: order.stripePaymentIntentId }, { idempotencyKey: `refund-${orderId}` });
    } catch (err) {
      console.error("[admin] refund failed", err);
      return { ok: false, message: "Stripe could not refund this payment. Nothing was changed." };
    }
  }
  // Stripe also sends `charge.refunded`; both paths end in the same idempotent transition.
  const r = await markOrderRefunded(orderId);
  refresh();
  return r.changed ? { ok: true, message: "Refunded and restocked." } : { ok: false, message: "This order was already refunded." };
}

const stockSchema = z.object({ variant: id, stock: z.coerce.number().int().min(0).max(9999) });

export async function setVariantStock(_prev: AdminActionState, form: FormData): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = stockSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, message: "Stock must be a whole number from 0 to 9999." };
  await db.productVariant.update({ where: { id: parsed.data.variant }, data: { stockQuantity: parsed.data.stock } });
  refresh();
  revalidatePath("/", "layout");
  return { ok: true, message: "Stock saved." };
}

const activeSchema = z.object({ product: id, active: z.enum(["true", "false"]) });

/** Hide a product from the storefront without deleting it (orders keep their snapshots). */
export async function setProductActive(form: FormData) {
  await requireAdmin();
  const parsed = activeSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return;
  await db.product.update({ where: { id: parsed.data.product }, data: { isActive: parsed.data.active === "true" } });
  refresh();
  revalidatePath("/", "layout");
}
