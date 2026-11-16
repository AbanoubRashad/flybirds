import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/auth";
import { AdminNav } from "@/features/admin/admin-nav";
import { RevenueChart } from "@/features/admin/revenue-chart";
import { cn, formatPrice } from "@/lib/utils";
import { getOverview, getRevenueSeries } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Ops", robots: { index: false } };
export const dynamic = "force-dynamic";

const DAYS = 30;

export default async function AdminPage() {
  await requireAdmin(); // middleware already gates; this is defence in depth
  const [overview, series] = await Promise.all([getOverview(DAYS), getRevenueSeries(DAYS)]);

  const stats = [
    { label: `Revenue · ${DAYS} days`, value: formatPrice(overview.revenue) },
    { label: "Paid orders", value: overview.orders.toLocaleString("en-US") },
    { label: "Average order", value: formatPrice(overview.averageOrder) },
    { label: "Waiting to ship", value: overview.toShip.toLocaleString("en-US"), href: "/admin/orders?status=PAID" },
  ];
  const lowCount = overview.lowStock.filter((v) => v.stockQuantity > 0).length;

  return (
    <div className="container-page max-w-6xl py-12 md:py-16">
      <p className="label-mono text-forest">Ops</p>
      <h1 className="display mt-4 text-[clamp(44px,6vw,72px)]">Overview</h1>
      <div className="mt-6"><AdminNav current="/admin" /></div>

      <dl className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[20px] bg-sand/60 p-5 sm:p-6">
            <dt className="label-mono text-muted">{s.label}</dt>
            <dd className="mt-3 font-serif text-[40px] leading-none tabular-nums">
              {s.href ? <Link href={s.href} className="underline-offset-4 hover:underline">{s.value}</Link> : s.value}
            </dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="revenue-heading" className="mt-12">
        <h2 id="revenue-heading" className="font-serif text-3xl">Revenue, last {DAYS} days</h2>
        <p className="mt-1 text-sm text-muted">Paid and shipped orders, by day (UTC). {overview.refunded > 0 && `${overview.refunded} refunded in this period.`}</p>
        <div className="mt-5"><RevenueChart data={series} /></div>
      </section>

      <section aria-labelledby="stock-heading" className="mt-14">
        <h2 id="stock-heading" className="font-serif text-3xl">Low-stock alerts</h2>
        <p className="mt-1 text-sm text-muted">
          {lowCount} variant{lowCount === 1 ? "" : "s"} with 1–3 left · {overview.soldOut.toLocaleString("en-US")} sold out · {overview.variants.toLocaleString("en-US")} tracked.{" "}
          <Link href="/admin/products" className="underline underline-offset-4">Edit stock</Link>
        </p>
        <div className="mt-5 overflow-x-auto rounded-[20px] ring-1 ring-inset ring-line">
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
              {overview.lowStock.map((v) => (
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
              {overview.lowStock.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-12 text-center text-muted">Everything is well stocked.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
