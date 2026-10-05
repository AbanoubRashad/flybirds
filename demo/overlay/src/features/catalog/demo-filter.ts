import type { CatalogParams } from "@/server/queries/catalog-params";

/**
 * The Prisma `where` / `orderBy` from `getCatalog`, rewritten as plain array
 * operations. Pure, so the static demo runs it at build time (defaults) and
 * again in the browser whenever the URL's filters change.
 */

export interface ProductCard {
  id: string; name: string; slug: string; tagline: string; basePrice: number; gender: "MEN" | "WOMEN" | "UNISEX"; sustainabilityRating: number;
  category: { name: string; slug: string };
  variants: { id: string; color: string; colorHex: string; images: string[]; priceOverride: number | null; stockQuantity: number; size: string }[];
}

/** A card plus the fields only filtering and sorting need. */
export interface CatalogItem extends ProductCard {
  materials: string[];
  createdAt: number;
}

const ORDER: Record<CatalogParams["sort"], (a: CatalogItem, b: CatalogItem) => number> = {
  featured: (a, b) => b.sustainabilityRating - a.sustainabilityRating || a.name.localeCompare(b.name),
  "price-asc": (a, b) => a.basePrice - b.basePrice,
  "price-desc": (a, b) => b.basePrice - a.basePrice,
  newest: (a, b) => b.createdAt - a.createdAt,
  eco: (a, b) => b.sustainabilityRating - a.sustainabilityRating,
};

export function filterCatalog(items: CatalogItem[], p: CatalogParams): CatalogItem[] {
  const q = p.q?.toLowerCase();
  return items
    .filter((it) =>
      (p.sub.length === 0 || p.sub.includes(it.category.slug)) &&
      (!p.gender || it.gender === p.gender || it.gender === "UNISEX") &&
      (p.material.length === 0 || it.materials.some((m) => p.material.includes(m))) &&
      (p.min === undefined || it.basePrice >= p.min) &&
      (p.max === undefined || it.basePrice <= p.max) &&
      // Size and colour must match on the *same* variant ("size 10 in Fern").
      ((p.size.length === 0 && p.color.length === 0) ||
        it.variants.some((v) => (p.size.length === 0 || p.size.includes(v.size)) && (p.color.length === 0 || p.color.includes(v.color)))) &&
      (!q || it.name.toLowerCase().includes(q) || it.tagline.toLowerCase().includes(q) || it.materials.includes(p.q!)),
    )
    .sort(ORDER[p.sort])
    .slice(0, 60);
}
