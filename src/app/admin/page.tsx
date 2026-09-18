import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ops", robots: { index: false } };

// Phase 4 replaces this with the full ops dashboard (tables, Recharts, alerts).
export default async function AdminPage() {
  await requireAdmin(); // middleware already gates; this is defence in depth
  const [lowStock, soldOut, variants] = await Promise.all([
    db.productVariant.findMany({
      where: { stockQuantity: { lte: 3 } }, orderBy: [{ stockQuantity: "asc" }, { sku: "asc" }], take: 25,
      select: { sku: true, size: true, color: true, colorHex: true, stockQuantity: true, product: { select: { name: true, slug: true } } },
    }),
    db.productVariant.count({ where: { stockQuantity: 0 } }),
    db.productVariant.count(),
  ]);

  const stats = [
    { label: "Variants tracked", value: variants.toLocaleString("en-US") },
    { label: "Low stock (1–3)", value: String(lowStock.filter((v) => v.stockQuantity > 0).length) },
    { label: "Sold out", value: soldOut.toLocaleString("en-US") },
  ];

  return (
    <div className="container-page max-w-6xl py-12 md:py-16">
      <p className="label-mono text-forest">Ops</p>
      <h1 className="display mt-4 text-[clamp(44px,6vw,72px)]">Low-stock alerts</h1>

      <dl className="mt-10 grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[20px] bg-sand/60 p-5 sm:p-6">
            <dt className="label-mono text-muted">{s.label}</dt>
            <dd className="mt-3 font-serif text-[44px] leading-none">{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 overflow-x-auto rounded-[20px] ring-1 ring-inset ring-line">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Variants with three or fewer units in stock, lowest first</caption>
          <thead className="bg-sand/60">
            <tr className="label-mono text-muted">
              <th scope="col" className="px-5 py-4 font-normal">SKU</th>
              <th scope="col" className="px-5 py-4 font-normal">Product</th>
              <th scope="col" className="px-5 py-4 font-normal">Colour / size</th>
              <th scope="col" className="px-5 py-4 text-right font-normal">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {lowStock.map((v) => (
              <tr key={v.sku} className="transition-colors hover:bg-sand/40">
                <td className="px-5 py-3.5 font-mono text-xs text-muted">{v.sku}</td>
                <td className="px-5 py-3.5 font-semibold"><Link href={`/products/${v.product.slug}?color=${encodeURIComponent(v.color)}`} className="hover:underline hover:underline-offset-4">{v.product.name}</Link></td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-2"><span className="size-3.5 rounded-full ring-1 ring-inset ring-slate/15" style={{ backgroundColor: v.colorHex }} aria-hidden />{v.color} · {v.size}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className={cn("label-mono inline-flex min-w-16 justify-center rounded-full px-3 py-1", v.stockQuantity === 0 ? "bg-slate text-bone" : "bg-ember/20 text-slate")}>
                    {v.stockQuantity === 0 ? "Sold out" : `${v.stockQuantity} left`}
                  </span>
                </td>
              </tr>
            ))}
            {lowStock.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-muted">Everything is well stocked.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
