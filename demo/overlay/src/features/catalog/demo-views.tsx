"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, type ReactNode } from "react";
import { FilterSidebar, SortSelect, type Facets } from "@/features/catalog/filter-sidebar";
import { ProductGrid } from "@/features/catalog/product-grid";
import { parseCatalogParams, type CatalogParams } from "@/server/queries/catalog-params";
import { filterCatalog, type CatalogItem } from "./demo-filter";

/**
 * Static-demo views. A static export can't read the query string at build
 * time, so the page ships every product in scope and filters in the browser.
 * The Suspense fallback is the unfiltered render, which is also the
 * prerendered HTML; the URL-aware version takes over after hydration.
 */

const DEFAULTS = parseCatalogParams({});

function WithUrlParams({ children }: { children: (p: CatalogParams) => ReactNode }) {
  const sp = useSearchParams();
  const params = useMemo(() => parseCatalogParams(Object.fromEntries(sp)), [sp]);
  return <>{children(params)}</>;
}

function UrlParams({ children }: { children: (p: CatalogParams) => ReactNode }) {
  return (
    <Suspense fallback={children(DEFAULTS)}>
      <WithUrlParams>{children}</WithUrlParams>
    </Suspense>
  );
}

// ─── Collection ──────────────────────────────────────────────────────────

interface CollectionProps {
  category: string;
  department: { name: string; children: { name: string }[] };
  items: CatalogItem[];
  facets: Facets;
}

export function CollectionView(props: CollectionProps) {
  return <UrlParams>{(p) => <Collection {...props} params={p} />}</UrlParams>;
}

function Collection({ category, department, items, facets, params }: CollectionProps & { params: CatalogParams }) {
  const products = useMemo(() => filterCatalog(items, params), [items, params]);
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

// ─── Search ──────────────────────────────────────────────────────────────

export function SearchView({ items }: { items: CatalogItem[] }) {
  return <UrlParams>{(p) => <SearchResults items={items} params={p} />}</UrlParams>;
}

function SearchResults({ items, params }: { items: CatalogItem[]; params: CatalogParams }) {
  const products = useMemo(() => (params.q ? filterCatalog(items, params) : []), [items, params]);

  return (
    <div className="container-page">
      <header className="flex flex-col gap-6 border-b border-line pb-8 pt-12 md:flex-row md:items-end md:justify-between md:pt-16">
        <div>
          <p className="label-mono text-forest">Search · {String(products.length).padStart(2, "0")} results</p>
          <h1 className="display mt-4 text-[clamp(44px,6vw,80px)]">
            {params.q ? <>Results for <em>&ldquo;{params.q}&rdquo;</em></> : "Search the catalog"}
          </h1>
        </div>
        {products.length > 0 && <Suspense><SortSelect /></Suspense>}
      </header>
      <section aria-labelledby="results-heading" className="pt-10">
        <h2 id="results-heading" className="sr-only">Results</h2>
        {params.q ? <ProductGrid products={products} className="lg:grid-cols-4" empty={{ message: "Nothing matched that search — try a material or a product name.", href: "/collections/mens-footwear", cta: "Browse men's footwear" }} /> : <p className="text-muted">Use the search button in the header to find shoes, apparel and gear.</p>}
      </section>
    </div>
  );
}
