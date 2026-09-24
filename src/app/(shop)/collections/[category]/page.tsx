import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FilterSidebar, SortSelect } from "@/features/catalog/filter-sidebar";
import { ProductCard } from "@/features/catalog/product-card";
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
    <div className="mx-auto max-w-7xl px-6">
      <div className="flex flex-wrap items-end justify-between gap-4 py-12">
        <div>
          <p className="label-mono text-forest-500">Collection / {String(products.length).padStart(2, "0")} results</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">{department.name}</h1>
        </div>
        <Suspense><SortSelect /></Suspense>
      </div>
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <Suspense><FilterSidebar facets={facets} showGender={unisexDept} /></Suspense>
        <section className="grid content-start gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          {products.length === 0 && <p className="label-mono col-span-full py-24 text-center text-slate-400">No products match these filters.</p>}
        </section>
      </div>
    </div>
  );
}
