"use server";

import { z } from "zod";
import { db } from "@/lib/db";

const linesSchema = z.array(z.object({ variantId: z.string().cuid(), quantity: z.number().int().min(1).max(10) })).max(50);

export type ReconciledLine = { variantId: string; quantity: number; unitPrice: number; available: number; removed: boolean };

/**
 * The client cart is optimistic; this is the source of truth. It clamps
 * quantities to live stock and returns authoritative prices so the drawer can
 * roll back or correct silently after the fact.
 */
export async function reconcileCart(input: unknown): Promise<ReconciledLine[]> {
  const lines = linesSchema.parse(input);
  if (!lines.length) return [];
  const variants = await db.productVariant.findMany({
    where: { id: { in: lines.map((l) => l.variantId) }, product: { isActive: true } },
    select: { id: true, stockQuantity: true, priceOverride: true, product: { select: { basePrice: true } } },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  return lines.map((l) => {
    const v = byId.get(l.variantId);
    if (!v || v.stockQuantity === 0) return { ...l, unitPrice: 0, available: 0, removed: true };
    return {
      variantId: l.variantId,
      quantity: Math.min(l.quantity, v.stockQuantity),
      unitPrice: v.priceOverride ?? v.product.basePrice,
      available: v.stockQuantity,
      removed: false,
    };
  });
}
