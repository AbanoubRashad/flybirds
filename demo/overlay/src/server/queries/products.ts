import "server-only";
import { cache } from "react";
import { compareSizes } from "@/lib/sizes";
import { filterCatalog, type CatalogItem, type ProductCard } from "@/features/catalog/demo-filter";
import { categories, categoryById, departments, products, type DemoProduct } from "@/server/demo/store";
import type { CatalogParams } from "./catalog-params";

// Static-demo twin of the Prisma query module: same exports and shapes, read
// from the in-memory catalog instead of Postgres.

export { SORTS, catalogParamsSchema, parseCatalogParams, type CatalogParams } from "./catalog-params";
export type { ProductCard, CatalogItem };

const toItem = (p: DemoProduct): CatalogItem => {
  const c = categoryById.get(p.categoryId)!;
  return {
    id: p.id, name: p.name, slug: p.slug, tagline: p.tagline, basePrice: p.basePrice, gender: p.gender,
    sustainabilityRating: p.sustainabilityRating, category: { name: c.name, slug: c.slug },
    variants: p.variants.map(({ id, color, colorHex, images, priceOverride, stockQuantity, size }) => ({ id, color, colorHex, images, priceOverride, stockQuantity, size })),
    materials: p.materials, createdAt: p.createdAt.getTime(),
  };
};

const withChildren = (slug: string) => {
  const dept = departments.find((d) => d.slug === slug);
  if (!dept) return null;
  return { ...dept, children: categories.filter((c) => c.parentId === dept.id).sort((a, b) => a.sortOrder - b.sortOrder) };
};

export const getCategoryTree = cache(async () => departments.map((d) => withChildren(d.slug)!));

export const departmentSlugs = () => departments.map((d) => d.slug);
export const productSlugs = () => products.map((p) => p.slug);

/** Every active product in a department (or the whole store), unfiltered — the browser filters it. */
export function getItems(departmentSlug: string | null): CatalogItem[] {
  const dept = departmentSlug ? withChildren(departmentSlug) : null;
  const ids = dept ? new Set(dept.children.map((c) => c.id)) : null;
  return products.filter((p) => p.isActive && (!ids || ids.has(p.categoryId))).map(toItem);
}

export async function getCatalog(departmentSlug: string | null, p: CatalogParams) {
  const dept = departmentSlug ? withChildren(departmentSlug) : null;
  if (departmentSlug && !dept) return { department: null, products: [] as CatalogItem[], facets: emptyFacets };
  const scope = getItems(departmentSlug);

  // Facets span the department, not the filtered set, so options never vanish.
  const colors = new Map<string, string>();
  for (const it of scope) for (const v of it.variants) if (!colors.has(v.color)) colors.set(v.color, v.colorHex);

  return {
    department: dept,
    products: filterCatalog(scope, p),
    facets: {
      subcategories: dept?.children.map((c) => ({ slug: c.slug, name: c.name })) ?? [],
      sizes: [...new Set(scope.flatMap((it) => it.variants.map((v) => v.size)))].sort(compareSizes),
      colors: [...colors].map(([color, colorHex]) => ({ color, colorHex })),
      materials: [...new Set(scope.flatMap((it) => it.materials))].sort(),
    },
  };
}

const emptyFacets = { subcategories: [], sizes: [], colors: [], materials: [] };

export const getProductBySlug = cache(async (slug: string) => {
  const product = products.find((p) => p.slug === slug);
  if (!product || !product.isActive) return null;
  const category = categoryById.get(product.categoryId)!;
  const reviews = [...product.reviews].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  const avgRating = reviews.length ? reviews.reduce((n, r) => n + r.rating, 0) / reviews.length : 0;
  return {
    ...product,
    category: { ...category, parent: category.parentId ? categoryById.get(category.parentId) ?? null : null },
    variants: [...product.variants].sort((a, b) => a.color.localeCompare(b.color)),
    reviews: reviews.slice(0, 10),
    _count: { reviews: reviews.length },
    avgRating,
  };
});
export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function suggestProducts(q: string) {
  if (q.trim().length < 2) return [];
  const needle = q.toLowerCase();
  return products.filter((p) => p.isActive && p.name.toLowerCase().includes(needle)).slice(0, 6).map(({ name, slug, basePrice }) => ({ name, slug, basePrice }));
}

/** Data behind the ops page: variants with three or fewer units, lowest first. */
export function getStockReport() {
  const all = products.flatMap((p) => p.variants.map((v) => ({ ...v, product: { name: p.name, slug: p.slug } })));
  const lowStock = all
    .filter((v) => v.stockQuantity <= 3)
    .sort((a, b) => a.stockQuantity - b.stockQuantity || a.sku.localeCompare(b.sku))
    .slice(0, 25);
  return { lowStock, soldOut: all.filter((v) => v.stockQuantity === 0).length, variants: all.length };
}
