import "server-only";
import { cache } from "react";
import { Prisma, type Gender } from "@prisma/client";
import { db } from "@/lib/db";
import { compareSizes } from "@/lib/sizes";

export { SORTS, catalogParamsSchema, parseCatalogParams, type CatalogParams } from "./catalog-params";
import type { CatalogParams } from "./catalog-params";

// ─── Queries ──────────────────────────────────────────────────────────────

const cardSelect = {
  id: true, name: true, slug: true, tagline: true, basePrice: true, gender: true, sustainabilityRating: true,
  category: { select: { name: true, slug: true } },
  variants: { select: { id: true, color: true, colorHex: true, images: true, priceOverride: true, stockQuantity: true, size: true } },
} satisfies Prisma.ProductSelect;

export type ProductCard = Prisma.ProductGetPayload<{ select: typeof cardSelect }>;

export const getCategoryTree = cache(() =>
  db.category.findMany({ where: { parentId: null }, orderBy: { sortOrder: "asc" }, include: { children: { orderBy: { sortOrder: "asc" } } } }),
);

export async function getCatalog(departmentSlug: string | null, p: CatalogParams) {
  const dept = departmentSlug
    ? await db.category.findUnique({ where: { slug: departmentSlug }, include: { children: true } })
    : null;

  const categoryIds = dept
    ? (p.sub.length ? dept.children.filter((c) => p.sub.includes(c.slug)) : dept.children).map((c) => c.id)
    : undefined;

  // Variant-level facets must match on the *same* variant (size AND color),
  // so they're combined inside a single `some` clause.
  const variantWhere: Prisma.ProductVariantWhereInput = {
    ...(p.size.length > 0 && { size: { in: p.size } }),
    ...(p.color.length > 0 && { color: { in: p.color } }),
  };

  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(categoryIds && { categoryId: { in: categoryIds } }),
    ...(p.gender && { gender: { in: [p.gender, "UNISEX"] as Gender[] } }),
    ...(p.material.length > 0 && { materials: { hasSome: p.material } }),
    ...((p.min !== undefined || p.max !== undefined) && { basePrice: { gte: p.min, lte: p.max } }),
    ...(Object.keys(variantWhere).length > 0 && { variants: { some: variantWhere } }),
    ...(p.q && {
      OR: [
        { name: { contains: p.q, mode: "insensitive" } },
        { tagline: { contains: p.q, mode: "insensitive" } },
        { materials: { has: p.q } },
      ],
    }),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = {
    featured: [{ sustainabilityRating: "desc" }, { name: "asc" }],
    "price-asc": [{ basePrice: "asc" }],
    "price-desc": [{ basePrice: "desc" }],
    newest: [{ createdAt: "desc" }],
    eco: [{ sustainabilityRating: "desc" }],
  }[p.sort] as Prisma.ProductOrderByWithRelationInput[];

  // Facets are computed over the department (not the filtered set) so options
  // never disappear as the user narrows — standard faceted-search UX.
  const facetScope: Prisma.ProductWhereInput = { isActive: true, ...(dept && { categoryId: { in: dept.children.map((c) => c.id) } }) };

  const [products, sizes, colors, materials] = await Promise.all([
    db.product.findMany({ where, orderBy, select: cardSelect, take: 60 }),
    db.productVariant.findMany({ where: { product: facetScope }, distinct: ["size"], select: { size: true } }),
    db.productVariant.findMany({ where: { product: facetScope }, distinct: ["color"], select: { color: true, colorHex: true } }),
    db.product.findMany({ where: facetScope, select: { materials: true } }),
  ]);

  return {
    department: dept,
    products,
    facets: {
      subcategories: dept?.children.map((c) => ({ slug: c.slug, name: c.name })) ?? [],
      sizes: sortSizes(sizes.map((s) => s.size)),
      colors,
      materials: [...new Set(materials.flatMap((m) => m.materials))].sort(),
    },
  };
}

const sortSizes = (sizes: string[]) => sizes.sort(compareSizes);

export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.product.findUnique({
    where: { slug },
    include: {
      category: { include: { parent: true } },
      variants: { orderBy: [{ color: "asc" }] },
      reviews: { orderBy: { createdAt: "desc" }, take: 10, include: { user: { select: { name: true } } } },
      _count: { select: { reviews: true } },
    },
  });
  if (!product || !product.isActive) return null;
  const agg = await db.review.aggregate({ where: { productId: product.id }, _avg: { rating: true } });
  return { ...product, carbonKg: Number(product.carbonKg), avgRating: agg._avg.rating ?? 0 };
});
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

/** Lightweight autocomplete (used by the search overlay in Phase 3). */
export async function suggestProducts(q: string) {
  if (q.trim().length < 2) return [];
  return db.product.findMany({
    where: { isActive: true, name: { contains: q, mode: "insensitive" } },
    select: { name: true, slug: true, basePrice: true },
    take: 6,
  });
}
