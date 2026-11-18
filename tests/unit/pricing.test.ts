import { describe, expect, it } from "vitest";
import { quoteCart, shippingFor, type PricedVariant } from "@/server/checkout/pricing";

const variant = (over: Partial<PricedVariant> & { id: string }): PricedVariant => ({
  size: "10",
  color: "Fern",
  stockQuantity: 5,
  priceOverride: null,
  image: null,
  product: { name: "Tempo Runner", slug: "tempo-runner", basePrice: 14500, isActive: true },
  ...over,
});

describe("shippingFor", () => {
  it("charges the flat rate under $75, then free standard, then free express from $150", () => {
    expect(shippingFor(7499)).toEqual({ amount: 800, label: "Standard" });
    expect(shippingFor(7500)).toEqual({ amount: 0, label: "Free standard" });
    expect(shippingFor(14999)).toEqual({ amount: 0, label: "Free standard" });
    expect(shippingFor(15000)).toEqual({ amount: 0, label: "Free express" });
  });
});

describe("quoteCart", () => {
  it("prices from the catalog, never from the request", () => {
    const q = quoteCart([{ variantId: "a", quantity: 2 }], [variant({ id: "a" })]);
    expect(q).toMatchObject({ ok: true, subtotal: 29000, shipping: 0, total: 29000, shippingLabel: "Free express" });
  });

  it("uses a variant's price override and adds shipping on small carts", () => {
    const q = quoteCart([{ variantId: "a", quantity: 1 }], [variant({ id: "a", priceOverride: 1800, product: { name: "Crew Sock", slug: "crew-sock", basePrice: 2200, isActive: true } })]);
    expect(q).toMatchObject({ ok: true, subtotal: 1800, shipping: 800, total: 2600, shippingLabel: "Standard" });
    if (q.ok) expect(q.lines[0]).toMatchObject({ productName: "Crew Sock", unitPrice: 1800, quantity: 1 });
  });

  it("merges the same variant sent twice so limits apply to the total", () => {
    const q = quoteCart([{ variantId: "a", quantity: 3 }, { variantId: "a", quantity: 3 }], [variant({ id: "a", stockQuantity: 5 })]);
    expect(q).toEqual({ ok: false, problems: [{ kind: "insufficient_stock", variantId: "a", available: 5, productName: "Tempo Runner", size: "10" }] });
  });

  it("refuses unknown, inactive and sold-out variants", () => {
    const q = quoteCart(
      [{ variantId: "gone", quantity: 1 }, { variantId: "hidden", quantity: 1 }, { variantId: "empty", quantity: 1 }, { variantId: "fine", quantity: 1 }],
      [variant({ id: "hidden", product: { name: "X", slug: "x", basePrice: 100, isActive: false } }), variant({ id: "empty", stockQuantity: 0 }), variant({ id: "fine" })],
    );
    expect(q.ok).toBe(false);
    if (!q.ok) expect(q.problems.map((p) => [p.kind, p.variantId])).toEqual([["unavailable", "gone"], ["unavailable", "hidden"], ["unavailable", "empty"]]);
  });

  it("caps a line at 10 even when more is in stock", () => {
    const q = quoteCart([{ variantId: "a", quantity: 11 }], [variant({ id: "a", stockQuantity: 40 })]);
    expect(q).toMatchObject({ ok: false, problems: [{ kind: "insufficient_stock", available: 10 }] });
  });

  it("an empty cart is not a quote", () => {
    expect(quoteCart([], [])).toEqual({ ok: false, problems: [] });
  });
});
