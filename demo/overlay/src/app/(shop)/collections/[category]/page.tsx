import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CollectionView } from "@/features/catalog/demo-views";
import { departmentSlugs, getCatalog, getItems, parseCatalogParams } from "@/server/queries/products";

// Static demo: one prerendered page per department; filters run in the browser.
export const dynamicParams = false;
export const generateStaticParams = () => departmentSlugs().map((category) => ({ category }));

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  return { title: category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) };
}

export default async function CollectionPage({ params }: Props) {
  const { category } = await params;
  const { department, facets } = await getCatalog(category, parseCatalogParams({}));
  if (!department) notFound();
  return <CollectionView category={category} department={department} items={getItems(category)} facets={facets} />;
}
