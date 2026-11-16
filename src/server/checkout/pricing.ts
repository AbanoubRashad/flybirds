import { EXPRESS_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING, type Cents } from "@/lib/utils";

/** What the client asks for. Prices are never taken from the client. */
export type RequestedLine = { variantId: string; quantity: number };

/** The slice of a variant that pricing needs (loaded from the database). */
export type PricedVariant = {
  id: string;
  size: string;
  color: string;
  stockQuantity: number;
  priceOverride: number | null;
  image: string | null;
  product: { name: string; slug: string; basePrice: number; isActive: boolean };
};

export type OrderLine = {
  variantId: string;
  productName: string;
  productSlug: string;
  size: string;
  color: string;
  image: string | null;
  unitPrice: Cents;
  quantity: number;
};

export type Quote =
  | { ok: true; lines: OrderLine[]; subtotal: Cents; shipping: Cents; total: Cents; shippingLabel: "Standard" | "Free standard" | "Free express" }
  | { ok: false; problems: CartProblem[] };

export type CartProblem =
  | { kind: "unavailable"; variantId: string }
  | { kind: "insufficient_stock"; variantId: string; available: number; productName: string; size: string };

export const MAX_PER_LINE = 10;

export function shippingFor(subtotal: Cents): { amount: Cents; label: "Standard" | "Free standard" | "Free express" } {
  if (subtotal >= EXPRESS_SHIPPING_THRESHOLD) return { amount: 0, label: "Free express" };
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return { amount: 0, label: "Free standard" };
  return { amount: STANDARD_SHIPPING, label: "Standard" };
}

/**
 * Price a cart from live catalog data. Unlike the drawer's `reconcileCart`
 * (which quietly clamps), checkout refuses a cart that can't be fulfilled
 * exactly, so the customer never pays for something different from what they saw.
 */
export function quoteCart(requested: RequestedLine[], variants: PricedVariant[]): Quote {
  const byId = new Map(variants.map((v) => [v.id, v]));
  // The same variant twice is merged, so limits apply to the total.
  const wanted = new Map<string, number>();
  for (const l of requested) wanted.set(l.variantId, (wanted.get(l.variantId) ?? 0) + l.quantity);

  const problems: CartProblem[] = [];
  const lines: OrderLine[] = [];
  for (const [variantId, quantity] of wanted) {
    const v = byId.get(variantId);
    if (!v || !v.product.isActive || v.stockQuantity === 0) {
      problems.push({ kind: "unavailable", variantId });
      continue;
    }
    const available = Math.min(v.stockQuantity, MAX_PER_LINE);
    if (quantity > available) {
      problems.push({ kind: "insufficient_stock", variantId, available, productName: v.product.name, size: v.size });
      continue;
    }
    lines.push({
      variantId,
      productName: v.product.name,
      productSlug: v.product.slug,
      size: v.size,
      color: v.color,
      image: v.image,
      unitPrice: v.priceOverride ?? v.product.basePrice,
      quantity,
    });
  }
  if (problems.length || lines.length === 0) return { ok: false, problems };

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const shipping = shippingFor(subtotal);
  return { ok: true, lines, subtotal, shipping: shipping.amount, total: subtotal + shipping.amount, shippingLabel: shipping.label };
}
