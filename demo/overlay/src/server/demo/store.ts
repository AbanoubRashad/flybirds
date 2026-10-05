import "server-only";
import { buildCatalog, SHOPPERS, TREE, type Gender } from "../../../prisma/catalog";

/**
 * In-memory stand-in for Postgres, used only by the static demo build.
 * It mirrors exactly what `prisma/seed.ts` writes, with deterministic ids.
 */

export interface DemoCategory { id: string; name: string; slug: string; parentId: string | null; sortOrder: number }

export interface DemoVariant {
  id: string; productId: string; sku: string; size: string; color: string; colorHex: string;
  stockQuantity: number; priceOverride: number | null; images: string[];
}

export interface DemoReview {
  id: string; productId: string; userId: string; rating: number; title: string | null; comment: string;
  verifiedPurchase: boolean; createdAt: Date; user: { name: string | null };
}

export interface DemoProduct {
  id: string; name: string; slug: string; tagline: string; description: string; basePrice: number; gender: Gender;
  categoryId: string; materials: string[]; sustainabilityRating: number; carbonKg: number; careInstructions: string[];
  specs: Record<string, string>; isActive: boolean; createdAt: Date; updatedAt: Date;
  variants: DemoVariant[]; reviews: DemoReview[];
}

// Fixed timestamps keep builds reproducible; later products count as "newer", like the seed's insert order.
const EPOCH = Date.UTC(2025, 0, 6);

export const categories: DemoCategory[] = Object.entries(TREE).flatMap(([slug, { name, subs }], i) => [
  { id: slug, name, slug, parentId: null, sortOrder: i },
  ...subs.map(([subSlug, subName], j) => ({ id: subSlug, name: subName, slug: subSlug, parentId: slug, sortOrder: j })),
]);

export const categoryById = new Map(categories.map((c) => [c.id, c]));

export const products: DemoProduct[] = buildCatalog().map(({ category, variants, reviews, ...p }, i) => {
  const id = `prod_${p.slug}`;
  const createdAt = new Date(EPOCH + i * 3_600_000);
  return {
    ...p, id, categoryId: category, isActive: true, createdAt, updatedAt: createdAt,
    variants: variants.map((v) => ({ ...v, id: v.sku, productId: id })),
    reviews: reviews.map((r, k) => {
      const shopper = SHOPPERS[r.shopper]!;
      return {
        id: `rev_${p.slug}_${k}`, productId: id, userId: `user_${shopper}`, rating: r.rating, title: null, comment: r.comment,
        verifiedPurchase: r.verifiedPurchase, createdAt: new Date(EPOCH + 30 * 86_400_000 + (i * 4 + k) * 3_600_000),
        user: { name: shopper[0]!.toUpperCase() + shopper.slice(1) },
      };
    }),
  };
});

export const departments = categories.filter((c) => c.parentId === null);
