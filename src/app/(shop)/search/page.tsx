import type { Metadata } from "next";
import { Suspense } from "react";
import { SortSelect } from "@/features/catalog/filter-sidebar";
import { ProductGrid } from "@/features/catalog/product-grid";
import { getCatalog, parseCatalogParams } from "@/server/queries/products";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata: Metadata = { title: "Search", robots: { index: false } };

export default async function SearchPage({ searchParams }: Props) {
  const filters = parseCatalogParams(await searchParams);
  const { products } = filters.q ? await getCatalog(null, filters) : { products: [] };

  return (
    <div className="container-page">
      <header className="flex flex-col gap-6 border-b border-line pb-8 pt-12 md:flex-row md:items-end md:justify-between md:pt-16">
        <div>
          <p className="label-mono text-forest">Search · {String(products.length).padStart(2, "0")} results</p>
          <h1 className="display mt-4 text-[clamp(44px,6vw,80px)]">
            {filters.q ? <>Results for <em>&ldquo;{filters.q}&rdquo;</em></> : "Search the catalog"}
          </h1>
        </div>
        {products.length > 0 && <Suspense><SortSelect /></Suspense>}
      </header>
      <section aria-labelledby="results-heading" className="pt-10">
        <h2 id="results-heading" className="sr-only">Results</h2>
        {filters.q ? <ProductGrid products={products} className="lg:grid-cols-4" empty={{ message: "Nothing matched that search — try a material or a product name.", href: "/collections/mens-footwear", cta: "Browse men's footwear" }} /> : <p className="text-muted">Use the search button in the header to find shoes, apparel and gear.</p>}
      </section>
    </div>
  );
}
