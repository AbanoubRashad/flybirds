import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/auth";
import { OrderActions } from "@/features/admin/admin-forms";
import { AdminNav } from "@/features/admin/admin-nav";
import { STATUS_LABEL, StatusPill, orderNumber } from "@/features/checkout/order-summary";
import { cn, formatPrice } from "@/lib/utils";
import { ORDER_STATUSES, listOrders } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Orders · Ops", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const status = ORDER_STATUSES.find((s) => s === sp.status);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const { orders, total, pages } = await listOrders({ status, page });
  const link = (s: string | undefined, p = 1) => `/admin/orders${s || p > 1 ? `?${new URLSearchParams({ ...(s ? { status: s } : {}), ...(p > 1 ? { page: String(p) } : {}) })}` : ""}`;
  const chip = "inline-flex h-9 items-center rounded-full px-4 text-sm transition-colors";

  return (
    <div className="container-page max-w-6xl py-12 md:py-16">
      <p className="label-mono text-forest">Ops</p>
      <h1 className="display mt-4 text-[clamp(44px,6vw,72px)]">Orders</h1>
      <div className="mt-6"><AdminNav current="/admin/orders" /></div>

      <nav aria-label="Filter by status" className="mt-8 flex flex-wrap gap-2">
        <Link href={link(undefined)} aria-current={!status ? "true" : undefined} className={cn(chip, !status ? "bg-forest text-bone" : "ring-1 ring-inset ring-line-strong hover:bg-slate/5")}>All</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={link(s)} aria-current={status === s ? "true" : undefined} className={cn(chip, status === s ? "bg-forest text-bone" : "ring-1 ring-inset ring-line-strong hover:bg-slate/5")}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>
      <p className="mt-4 text-sm text-muted" role="status">{total.toLocaleString("en-US")} order{total === 1 ? "" : "s"}{status ? ` · ${STATUS_LABEL[status].toLowerCase()}` : ""}</p>

      <div className="mt-4 overflow-x-auto rounded-[20px] ring-1 ring-inset ring-line">
        <table className="w-full min-w-[820px] text-left text-sm">
          <caption className="sr-only">Orders, newest first</caption>
          <thead className="bg-sand/60">
            <tr className="label-mono text-muted">
              <th scope="col" className="px-5 py-4 font-normal">Order</th>
              <th scope="col" className="px-5 py-4 font-normal">Customer</th>
              <th scope="col" className="px-5 py-4 font-normal">Items</th>
              <th scope="col" className="px-5 py-4 text-right font-normal">Total</th>
              <th scope="col" className="px-5 py-4 font-normal">Status</th>
              <th scope="col" className="px-5 py-4 text-right font-normal">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="align-top transition-colors hover:bg-sand/40">
                <th scope="row" className="px-5 py-4 font-normal">
                  <Link href={`/checkout/success?order=${o.id}`} className="font-mono text-xs font-semibold hover:underline hover:underline-offset-4">{orderNumber(o.id)}</Link>
                  <time dateTime={o.createdAt.toISOString()} className="mt-1 block text-xs text-muted">{when.format(o.createdAt)}</time>
                </th>
                <td className="px-5 py-4">
                  <span className="block font-semibold">{o.user?.name ?? "Guest"}</span>
                  <span className="text-xs text-muted">{o.email || "no email yet"}</span>
                </td>
                <td className="px-5 py-4">
                  <ul className="space-y-0.5">
                    {o.items.map((i) => <li key={i.id}>{i.quantity} × {i.productName} <span className="text-muted">({i.color}, {i.size})</span></li>)}
                  </ul>
                </td>
                <td className="px-5 py-4 text-right tabular-nums">{formatPrice(o.totalAmount)}</td>
                <td className="px-5 py-4"><StatusPill status={o.status} /></td>
                <td className="px-5 py-4"><OrderActions orderId={o.id} status={o.status} number={orderNumber(o.id)} /></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-muted">{status ? "No orders with this status." : "No orders yet. They appear here as soon as a customer checks out."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={link(status, page - 1)} className="underline underline-offset-4">← Newer</Link> : <span />}
          <span className="text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link href={link(status, page + 1)} className="underline underline-offset-4">Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
