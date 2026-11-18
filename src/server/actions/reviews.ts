"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hasPurchased } from "@/server/orders";

const schema = z.object({
  product: z.string().cuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(10, "Tell us a little more (at least 10 characters).").max(1200),
});

export type ReviewState =
  | null
  | { ok: true; verified: boolean; updated: boolean }
  | { ok: false; error: "signin" | "invalid" | "not_found"; message: string };

/**
 * Write (or update) the signed-in customer's review of a product. One review
 * per customer per product. "Verified buyer" is decided here, from paid orders —
 * never from anything the browser sends.
 */
export async function submitReview(_prev: ReviewState, form: FormData): Promise<ReviewState> {
  const session = await auth();
  if (!session?.user.id) return { ok: false, error: "signin", message: "Sign in to leave a review." };

  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    return { ok: false, error: "invalid", message: parsed.error.issues[0]?.message ?? "Pick a rating and write a short review." };
  }
  const { product: productId, rating, comment } = parsed.data;

  const product = await db.product.findFirst({ where: { id: productId, isActive: true }, select: { slug: true } });
  if (!product) return { ok: false, error: "not_found", message: "This product is no longer available." };

  const verifiedPurchase = await hasPurchased(session.user.id, productId);
  const existing = await db.review.findUnique({ where: { productId_userId: { productId, userId: session.user.id } }, select: { id: true } });
  await db.review.upsert({
    where: { productId_userId: { productId, userId: session.user.id } },
    create: { productId, userId: session.user.id, rating, comment, verifiedPurchase },
    update: { rating, comment, verifiedPurchase },
  });
  revalidatePath(`/products/${product.slug}`);
  return { ok: true, verified: verifiedPurchase, updated: existing !== null };
}
