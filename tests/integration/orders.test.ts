import type Stripe from "stripe";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { handleStripeEvent } from "@/server/checkout/webhook";
import { cancelPendingOrder, hasPurchased, markOrderPaid, markOrderRefunded, markOrderShipped } from "@/server/orders";
import { sandboxPaymentIntentId, sandboxSessionId, stripe, webhookSecret } from "@/server/stripe";
import { isLocalDatabase } from "../local-db";

// These tests write rows. They only run against a local database.
const run = isLocalDatabase() ? describe : describe.skip;

const TAG = `it-${Date.now()}`;
let userId: string;
let productId: string;
let variantId: string;

const stock = async () => (await db.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stockQuantity;
const statusOf = async (id: string) => (await db.order.findUniqueOrThrow({ where: { id } })).status;

async function newOrder(quantity = 2) {
  const order = await db.order.create({
    data: {
      userId,
      email: `${TAG}@example.com`,
      subtotalAmount: 10000 * quantity,
      shippingAmount: 0,
      totalAmount: 10000 * quantity,
      items: { create: [{ variantId, productName: "Test Shoe", size: "10", color: "Fern", unitPrice: 10000, quantity }] },
    },
  });
  await db.order.update({ where: { id: order.id }, data: { stripeCheckoutId: sandboxSessionId(order.id) } });
  return order;
}

const completed = (orderId: string, over: Record<string, unknown> = {}) =>
  ({
    id: `evt_${orderId}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: sandboxSessionId(orderId), object: "checkout.session", client_reference_id: orderId, metadata: { orderId },
        payment_status: "paid", amount_total: 20000, currency: "usd", payment_intent: sandboxPaymentIntentId(orderId),
        customer_details: { email: "payer@example.com", name: "Payer", address: { line1: "1 Main St", line2: null, city: "Austin", state: "TX", postal_code: "73301", country: "US" } },
        ...over,
      },
    },
  }) as unknown as Stripe.Event;

run("order state machine and webhook (local database)", () => {
  beforeAll(async () => {
    const category = await db.category.create({ data: { name: TAG, slug: TAG } });
    const user = await db.user.create({ data: { email: `${TAG}@example.com`, name: "Integration" } });
    const product = await db.product.create({
      data: {
        name: "Test Shoe", slug: TAG, tagline: "t", description: "d", basePrice: 10000, gender: "UNISEX", categoryId: category.id,
        materials: [], sustainabilityRating: 50, carbonKg: 1, careInstructions: [], specs: {},
        variants: { create: [{ sku: TAG, size: "10", color: "Fern", colorHex: "#3E5641", stockQuantity: 5 }] },
      },
      include: { variants: true },
    });
    userId = user.id;
    productId = product.id;
    variantId = product.variants[0]!.id;
  });

  beforeEach(async () => {
    await db.order.deleteMany({ where: { userId } });
    await db.productVariant.update({ where: { id: variantId }, data: { stockQuantity: 5 } });
  });

  afterAll(async () => {
    await db.order.deleteMany({ where: { userId } });
    await db.product.deleteMany({ where: { slug: TAG } });
    await db.category.deleteMany({ where: { slug: TAG } });
    await db.user.deleteMany({ where: { id: userId } });
    await db.$disconnect();
  });

  it("paying takes stock exactly once, however many times it is reported", async () => {
    const order = await newOrder(2);
    expect(await markOrderPaid(order.id)).toEqual({ changed: true, status: "PAID" });
    expect(await markOrderPaid(order.id)).toEqual({ changed: false, status: "PAID" });
    expect(await stock()).toBe(3);
  });

  it("two simultaneous payment reports still take stock once", async () => {
    const order = await newOrder(2);
    const results = await Promise.all([markOrderPaid(order.id), markOrderPaid(order.id), markOrderPaid(order.id)]);
    expect(results.filter((r) => r.changed)).toHaveLength(1);
    expect(await stock()).toBe(3);
  });

  it("stock never goes below zero when an order oversells", async () => {
    await db.productVariant.update({ where: { id: variantId }, data: { stockQuantity: 1 } });
    const order = await newOrder(2);
    await markOrderPaid(order.id);
    expect(await stock()).toBe(0);
    expect(await statusOf(order.id)).toBe("PAID");
  });

  it("a refund returns the stock once; shipping only works on paid orders", async () => {
    const order = await newOrder(2);
    expect((await markOrderShipped(order.id)).changed).toBe(false);
    await markOrderPaid(order.id);
    expect((await markOrderShipped(order.id)).changed).toBe(true);
    expect(await markOrderRefunded(order.id)).toEqual({ changed: true, status: "REFUNDED" });
    expect(await markOrderRefunded(order.id)).toEqual({ changed: false, status: "REFUNDED" });
    expect(await stock()).toBe(5);
  });

  it("an unpaid order can be cancelled; a late payment on it is still honoured", async () => {
    const order = await newOrder(1);
    expect(await cancelPendingOrder(order.id)).toEqual({ changed: true, status: "CANCELLED" });
    expect(await stock()).toBe(5);
    expect(await cancelPendingOrder(order.id)).toEqual({ changed: false, status: "CANCELLED" });
    expect(await markOrderPaid(order.id)).toEqual({ changed: true, status: "PAID" });
    expect(await stock()).toBe(4);
  });

  it("the webhook marks the order paid, saves the email and address, and is idempotent", async () => {
    const order = await newOrder(2);
    expect(await handleStripeEvent(completed(order.id))).toMatchObject({ handled: true, changed: true });
    expect(await handleStripeEvent(completed(order.id))).toMatchObject({ handled: true, changed: false });
    const saved = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(saved).toMatchObject({ status: "PAID", email: "payer@example.com", stripePaymentIntentId: sandboxPaymentIntentId(order.id) });
    expect(saved.shippingAddress).toMatchObject({ line1: "1 Main St", city: "Austin", postalCode: "73301", country: "US" });
    expect(await stock()).toBe(3);
  });

  it("the webhook refuses an amount that does not match our order, and unpaid sessions", async () => {
    const order = await newOrder(2);
    expect(await handleStripeEvent(completed(order.id, { amount_total: 100 }))).toMatchObject({ handled: false, note: "amount mismatch" });
    expect(await handleStripeEvent(completed(order.id, { payment_status: "unpaid" }))).toMatchObject({ handled: true, changed: false });
    expect(await statusOf(order.id)).toBe("PENDING");
    expect(await stock()).toBe(5);
  });

  it("expired sessions cancel the order; a full refund event restocks; unknown events are ignored", async () => {
    const expiring = await newOrder(1);
    await handleStripeEvent({ type: "checkout.session.expired", data: { object: { metadata: { orderId: expiring.id } } } } as unknown as Stripe.Event);
    expect(await statusOf(expiring.id)).toBe("CANCELLED");

    const paid = await newOrder(2);
    await handleStripeEvent(completed(paid.id));
    const refund = { type: "charge.refunded", data: { object: { refunded: true, payment_intent: sandboxPaymentIntentId(paid.id), metadata: {} } } } as unknown as Stripe.Event;
    expect(await handleStripeEvent(refund)).toMatchObject({ handled: true, changed: true });
    expect(await statusOf(paid.id)).toBe("REFUNDED");
    expect(await stock()).toBe(5);

    expect(await handleStripeEvent({ type: "customer.created", data: { object: {} } } as unknown as Stripe.Event)).toMatchObject({ handled: false });
  });

  it("only a paid order makes the customer a verified buyer", async () => {
    const order = await newOrder(1);
    expect(await hasPurchased(userId, productId)).toBe(false);
    await markOrderPaid(order.id);
    expect(await hasPurchased(userId, productId)).toBe(true);
    await markOrderRefunded(order.id);
    expect(await hasPurchased(userId, productId)).toBe(false);
  });
});

describe("webhook signatures", () => {
  it("accepts a payload signed with the secret and rejects a tampered one", () => {
    const payload = JSON.stringify({ id: "evt_1", object: "event", type: "checkout.session.completed", data: { object: {} } });
    const header = stripe().webhooks.generateTestHeaderString({ payload, secret: webhookSecret() });
    expect(stripe().webhooks.constructEvent(payload, header, webhookSecret()).type).toBe("checkout.session.completed");
    expect(() => stripe().webhooks.constructEvent(payload.replace("evt_1", "evt_2"), header, webhookSecret())).toThrow();
    expect(() => stripe().webhooks.constructEvent(payload, header, "whsec_some_other_secret")).toThrow();
  });
});
