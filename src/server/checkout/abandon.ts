import "server-only";
import { cancelPendingOrder } from "@/server/orders";
import { stripe, stripeMode } from "@/server/stripe";

/**
 * The customer left checkout. In live mode the Stripe session is expired first,
 * so it can no longer be paid after we mark the order cancelled.
 */
export async function abandonCheckout(orderId: string, stripeCheckoutId: string | null) {
  if (stripeMode === "live" && stripeCheckoutId) {
    try {
      await stripe().checkout.sessions.expire(stripeCheckoutId);
    } catch {
      // Already completed or expired: the webhook settles the order either way.
      return;
    }
  }
  await cancelPendingOrder(orderId);
}
