import "server-only";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Order state machine. Every transition is a conditional update
 * (`WHERE status = <expected>`), so a webhook delivered twice, or two admins
 * clicking at once, changes the order — and the stock — exactly once.
 *
 *   PENDING ─ paid ─▶ PAID ─ ship ─▶ SHIPPED      (CANCELLED ─ late payment ─▶ PAID)
 *      │                │               │
 *      └─ cancel ─▶ CANCELLED     refund ▼ (from PAID or SHIPPED)
 *                                   REFUNDED
 */
export type PaymentDetails = {
  paymentIntentId?: string | null;
  email?: string | null;
  shippingAddress?: Prisma.InputJsonValue | null;
};

export type TransitionResult = { changed: boolean; status: OrderStatus | null };

async function currentStatus(tx: Prisma.TransactionClient, orderId: string) {
  return (await tx.order.findUnique({ where: { id: orderId }, select: { status: true } }))?.status ?? null;
}

/**
 * PENDING → PAID, and take the items out of stock. Safe to call any number of times.
 * A CANCELLED order is also accepted: if the customer backed out and the payment still
 * went through, the money was taken, so the order is honoured rather than lost.
 */
export async function markOrderPaid(orderId: string, payment: PaymentDetails = {}): Promise<TransitionResult> {
  return db.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["PENDING", "CANCELLED"] } },
      data: {
        status: "PAID",
        ...(payment.paymentIntentId ? { stripePaymentIntentId: payment.paymentIntentId } : {}),
        ...(payment.email ? { email: payment.email } : {}),
        ...(payment.shippingAddress ? { shippingAddress: payment.shippingAddress } : {}),
      },
    });
    if (claimed.count === 0) return { changed: false, status: await currentStatus(tx, orderId) };

    const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
    for (const item of items) {
      if (!item.variantId) continue;
      // Never below zero: if stock ran out between checkout and payment the order is still honoured
      // and shows up in the admin's low-stock list.
      await tx.$executeRaw`UPDATE "ProductVariant" SET "stockQuantity" = GREATEST("stockQuantity" - ${item.quantity}, 0) WHERE id = ${item.variantId}`;
    }
    return { changed: true, status: "PAID" as const };
  });
}

/** PENDING → CANCELLED (checkout abandoned or expired). Stock was never taken, so nothing to return. */
export async function cancelPendingOrder(orderId: string): Promise<TransitionResult> {
  return db.$transaction(async (tx) => {
    const r = await tx.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: "CANCELLED" } });
    return r.count ? { changed: true, status: "CANCELLED" as const } : { changed: false, status: await currentStatus(tx, orderId) };
  });
}

/** PAID → SHIPPED. */
export async function markOrderShipped(orderId: string): Promise<TransitionResult> {
  return db.$transaction(async (tx) => {
    const r = await tx.order.updateMany({ where: { id: orderId, status: "PAID" }, data: { status: "SHIPPED" } });
    return r.count ? { changed: true, status: "SHIPPED" as const } : { changed: false, status: await currentStatus(tx, orderId) };
  });
}

/** PAID or SHIPPED → REFUNDED, and put the items back in stock. */
export async function markOrderRefunded(orderId: string): Promise<TransitionResult> {
  return db.$transaction(async (tx) => {
    const r = await tx.order.updateMany({ where: { id: orderId, status: { in: ["PAID", "SHIPPED"] } }, data: { status: "REFUNDED" } });
    if (r.count === 0) return { changed: false, status: await currentStatus(tx, orderId) };
    const items = await tx.orderItem.findMany({ where: { orderId }, select: { variantId: true, quantity: true } });
    for (const item of items) {
      if (!item.variantId) continue;
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stockQuantity: { increment: item.quantity } } });
    }
    return { changed: true, status: "REFUNDED" as const };
  });
}

/** Has this customer paid for this product? (Used for the "verified purchase" badge on reviews.) */
export async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  const hit = await db.orderItem.findFirst({
    where: { variant: { productId }, order: { userId, status: { in: ["PAID", "SHIPPED"] } } },
    select: { id: true },
  });
  return hit !== null;
}
