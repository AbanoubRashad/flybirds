import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const orderSelect = {
  id: true, status: true, email: true, userId: true, createdAt: true,
  subtotalAmount: true, shippingAmount: true, totalAmount: true, shippingAddress: true, stripeCheckoutId: true,
  items: { select: { id: true, productName: true, size: true, color: true, unitPrice: true, quantity: true, variant: { select: { images: true, product: { select: { slug: true } } } } } },
} as const;

/**
 * An order for the confirmation pages. The id is an unguessable cuid, which is
 * what lets a guest see their own confirmation; an order that belongs to an
 * account is only shown to that account (or an admin).
 */
export async function getOrderForViewer(orderId: string) {
  if (!/^c[a-z0-9]{20,32}$/.test(orderId)) return null;
  const order = await db.order.findUnique({ where: { id: orderId }, select: orderSelect });
  if (!order) return null;
  if (order.userId) {
    const session = await auth();
    if (session?.user.id !== order.userId && session?.user.role !== "ADMIN") return null;
  }
  return order;
}

export type ViewerOrder = NonNullable<Awaited<ReturnType<typeof getOrderForViewer>>>;

export async function getOrdersForUser(userId: string) {
  return db.order.findMany({ where: { userId, status: { not: "CANCELLED" } }, orderBy: { createdAt: "desc" }, take: 50, select: orderSelect });
}

/** "j•••@example.com" — enough to recognise, not enough to harvest. */
export function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return user && domain ? `${user.slice(0, 1)}•••@${domain}` : "";
}
