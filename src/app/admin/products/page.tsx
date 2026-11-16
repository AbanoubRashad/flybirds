import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/auth";
import { StockForm } from "@/features/admin/admin-forms";
import { AdminNav } from "@/features/admin/admin-nav";
import { cn, formatPrice } from "@/lib/utils";
import { setProductActive } from "@/server/actions/admin";
import { listProducts } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Products · Ops", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await listProducts();
  const hidden = products.filter((p) => !p.isActive).length;

  return (
    <div className="container-page max-w-6xl py-12 md:py-16">
      <p className="label-mono text-forest">Ops</p>
      <h1 className="display mt-4 text-[clamp(44px,6vw,72px)]">Products</h1>
      <div className="mt-6"><AdminNav current="/admin/products" /></div>
      <p className="mt-8 text-sm text-muted">
        {products.length} products · {products.reduce((n, p) => n + p.variants.length, 0).toLocaleString("en-US")} variants{hidden > 0 && ` · ${hidden} hidden from the store`}. Open a product to edit stock per size and colour.
      </p>

      <ul className="mt-5 space-y-3">
        {products.map((p) => (
          <li key={p.id}>
            <details className="group rounded-[20px] ring-1 ring-inset ring-line open:bg-sand/30">
              <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{p.name}</span>
                  <span className="label-mono text-muted">{p.gender === "UNISEX" ? "" : `${p.gender === "MEN" ? "Men" : "Women"} · `}{p.category.name}</span>
                </span>
                <span className="tabular-nums">{formatPrice(p.basePrice)}</span>
                <span className="w-28 text-right text-sm tabular-nums text-muted">{p.stock.toLocaleString("en-US")} in stock</span>
                <span className={cn("label-mono inline-flex min-w-24 justify-center rounded-full px-3 py-1", p.soldOut > 0 ? "bg-ember/20 text-slate" : "bg-slate/5 text-muted")}>
                  {p.soldOut > 0 ? `${p.soldOut} sold out` : "All in stock"}
                </span>
                <span className={cn("label-mono inline-flex rounded-full px-3 py-1", p.isActive ? "bg-forest text-bone" : "bg-slate/10 text-muted")}>{p.isActive ? "Live" : "Hidden"}</span>
                <span aria-hidden className="font-serif text-2xl leading-none transition-transform group-open:rotate-45">+</span>
              </summary>

              <div className="border-t border-line px-5 py-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <Link href={`/products/${p.slug}`} className="text-sm underline underline-offset-4">View in store</Link>
                  <form action={setProductActive}>
                    <input type="hidden" name="product" value={p.id} />
                    <input type="hidden" name="active" value={p.isActive ? "false" : "true"} />
                    <button type="submit" className="inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold ring-1 ring-inset ring-line-strong transition-colors hover:bg-slate hover:text-bone">
                      {p.isActive ? "Hide from store" : "Show in store"}
                    </button>
                  </form>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <caption className="sr-only">Variants of {p.name}</caption>
                    <thead>
                      <tr className="label-mono text-muted">
                        <th scope="col" className="py-2 pr-4 font-normal">SKU</th>
                        <th scope="col" className="py-2 pr-4 font-normal">Colour / size</th>
                        <th scope="col" className="py-2 pr-4 text-right font-normal">Price</th>
                        <th scope="col" className="py-2 text-right font-normal">Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {p.variants.map((v) => (
                        <tr key={v.id}>
                          <td className="py-2 pr-4 font-mono text-xs text-muted">{v.sku}</td>
                          <td className="py-2 pr-4">
                            <span className="inline-flex items-center gap-2"><span className="size-3.5 rounded-full ring-1 ring-inset ring-slate/15" style={{ backgroundColor: v.colorHex }} aria-hidden />{v.color} · {v.size}</span>
                          </td>
                          <td className="py-2 pr-4 text-right tabular-nums">{formatPrice(v.priceOverride ?? p.basePrice)}</td>
                          <td className="py-2"><StockForm variantId={v.id} stock={v.stockQuantity} label={`${p.name}, ${v.color}, size ${v.size}`} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
