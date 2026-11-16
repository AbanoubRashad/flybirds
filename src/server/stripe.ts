import "server-only";
import { createHash } from "node:crypto";
import Stripe from "stripe";
import { env } from "@/lib/env";

/**
 * Two modes, one code path:
 *  - live:    STRIPE_SECRET_KEY is set → real Checkout Sessions and refunds.
 *  - sandbox: no key → a local checkout page stands in for Stripe's hosted
 *             page. It still sends a Stripe-shaped event, signed with the
 *             webhook secret, to the real `/api/webhooks/stripe` handler.
 */
export const stripeMode: "live" | "sandbox" = env.STRIPE_SECRET_KEY ? "live" : "sandbox";

let client: Stripe | undefined;

/** The SDK instance. In sandbox mode it is only used for webhook signing/verification (no network). */
export function stripe(): Stripe {
  client ??= new Stripe(env.STRIPE_SECRET_KEY ?? "sk_test_sandbox_placeholder");
  return client;
}

/**
 * The secret webhook signatures are checked against. Live: from Stripe.
 * Sandbox: derived from AUTH_SECRET, so it is stable per deployment and never shipped to the browser.
 */
export function webhookSecret(): string {
  if (env.STRIPE_WEBHOOK_SECRET) return env.STRIPE_WEBHOOK_SECRET;
  if (stripeMode === "live") throw new Error("STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set");
  return `whsec_sandbox_${createHash("sha256").update(`stripe-sandbox:${env.AUTH_SECRET}`).digest("hex").slice(0, 32)}`;
}

export const sandboxSessionId = (orderId: string) => `cs_sandbox_${orderId}`;
export const sandboxPaymentIntentId = (orderId: string) => `pi_sandbox_${orderId}`;
