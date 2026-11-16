import "server-only";
import type Stripe from "stripe";
import { db } from "@/lib/db";
import { cancelPendingOrder, markOrderPaid, markOrderRefunded } from "@/server/orders";

export type WebhookOutcome = { handled: boolean; orderId?: string; changed?: boolean; note?: string };

const orderIdOf = (o: { metadata?: Stripe.Metadata | null; client_reference_id?: string | null }) =>
  o.metadata?.orderId ?? o.client_reference_id ?? undefined;

function addressOf(session: Stripe.Checkout.Session) {
  const details = session.collected_information?.shipping_details ?? null;
  const address = details?.address ?? session.customer_details?.address ?? null;
  if (!address) return null;
  return {
    name: details?.name ?? session.customer_details?.name ?? null,
    line1: address.line1, line2: address.line2, city: address.city, state: address.state,
    postalCode: address.postal_code, country: address.country,
  };
}

/**
 * Apply one verified Stripe event. Every branch ends in a conditional order
 * transition, so replays (Stripe retries, duplicate deliveries) are harmless.
 */
export async function handleStripeEvent(event: Stripe.Event): Promise<WebhookOutcome> {
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      const orderId = orderIdOf(session);
      if (!orderId) return { handled: false, note: "no order id on the session" };
      // Delayed payment methods complete the session before the money arrives.
      if (session.payment_status !== "paid") return { handled: true, orderId, changed: false, note: "awaiting payment" };

      const order = await db.order.findUnique({ where: { id: orderId }, select: { totalAmount: true, currency: true } });
      if (!order) return { handled: false, orderId, note: "unknown order" };
      // The amount is checked against our own order, never trusted from the event.
      if (session.amount_total !== order.totalAmount || session.currency !== order.currency) {
        console.error(`[stripe] amount mismatch for order ${orderId}: got ${session.amount_total} ${session.currency}`);
        return { handled: false, orderId, note: "amount mismatch" };
      }
      const r = await markOrderPaid(orderId, {
        paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id,
        email: session.customer_details?.email,
        shippingAddress: addressOf(session),
      });
      return { handled: true, orderId, changed: r.changed };
    }

    case "checkout.session.expired":
    case "checkout.session.async_payment_failed": {
      const orderId = orderIdOf(event.data.object);
      if (!orderId) return { handled: false, note: "no order id on the session" };
      const r = await cancelPendingOrder(orderId);
      return { handled: true, orderId, changed: r.changed };
    }

    case "charge.refunded": {
      const charge = event.data.object;
      // Partial refunds keep the order as it is; only a full refund returns stock.
      if (!charge.refunded) return { handled: true, changed: false, note: "partial refund" };
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
      const order =
        (charge.metadata?.orderId ? await db.order.findUnique({ where: { id: charge.metadata.orderId }, select: { id: true } }) : null) ??
        (paymentIntentId ? await db.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId }, select: { id: true } }) : null);
      if (!order) return { handled: false, note: "no order for this charge" };
      const r = await markOrderRefunded(order.id);
      return { handled: true, orderId: order.id, changed: r.changed };
    }

    default:
      return { handled: false, note: `ignored ${event.type}` };
  }
}
