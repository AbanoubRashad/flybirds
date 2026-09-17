import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilterSidebar, SortSelect } from "@/features/catalog/filter-sidebar";
import { ProductGrid } from "@/features/catalog/product-grid";
import { getCatalog, parseCatalogParams } from "@/server/queries/products";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return { title: category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const filters = parseCatalogParams(sp);
  const { department, products, facets } = await getCatalog(category, filters);
  if (!department) notFound();

  const unisexDept = category === "apparel" || category === "accessories";

  return (
    <div className="container-page">
      <header className="flex flex-col gap-6 border-b border-line pb-8 pt-12 md:flex-row md:items-end md:justify-between md:pt-16">
        <div>
          <p className="label-mono text-forest">Collection · {String(products.length).padStart(2, "0")} {products.length === 1 ? "style" : "styles"}</p>
          <h1 className="display mt-4 text-[clamp(48px,7vw,88px)]">{department.name}</h1>
          <p className="mt-3 max-w-xl text-muted">{department.children.map((c) => c.name).join(" · ")}</p>
        </div>
        <Suspense fallback={<div className="h-11 w-44 rounded-full ring-1 ring-inset ring-line-strong" aria-hidden />}><SortSelect /></Suspense>
      </header>

      <div className="grid gap-8 pt-8 lg:grid-cols-[260px_1fr] lg:gap-12">
        {/* The fallback reserves the sidebar column (and the mobile Filters pill) so the grid never jumps. */}
        <Suspense fallback={<div className="h-11 lg:h-auto" aria-hidden />}>
          <FilterSidebar facets={facets} showGender={unisexDept} />
        </Suspense>
        <section aria-labelledby="products-heading">
          <h2 id="products-heading" className="sr-only">Products</h2>
          <ProductGrid products={products} empty={{ href: `/collections/${category}` }} />
        </section>
      </div>
    </div>
  );
}
