import type { Metadata } from "next";
import { SearchView } from "@/features/catalog/demo-views";
import { getItems } from "@/server/queries/products";

export const metadata: Metadata = { title: "Search", robots: { index: false } };

// Static demo: the whole catalog ships with the page and `?q=` is matched in the browser.
export default function SearchPage() {
  return <SearchView items={getItems(null)} />;
}
