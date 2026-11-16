import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { handleStripeEvent } from "@/server/checkout/webhook";
import { stripe, webhookSecret } from "@/server/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook. The signature is verified against the raw body before
 * anything is parsed; unsigned or tampered requests get a 400 and nothing
 * else happens. In sandbox mode the local checkout page signs its events
 * with the same secret, so this is the only way an order becomes PAID.
 */
export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, webhookSecret());
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  try {
    const outcome = await handleStripeEvent(event);
    return NextResponse.json({ received: true, ...outcome });
  } catch (err) {
    // A 500 makes Stripe retry later; the handlers are idempotent.
    console.error(`[stripe] failed to handle ${event.type}`, err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
}
