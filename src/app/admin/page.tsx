import { requireAdmin } from "@/auth";
import { db } from "@/lib/db";

// Phase 4 replaces this with the full ops dashboard (tables, Recharts, alerts).
export default async function AdminPage() {
  await requireAdmin(); // middleware already gates; this is defence in depth
  const lowStock = await db.productVariant.findMany({
    where: { stockQuantity: { lte: 3 } }, orderBy: { stockQuantity: "asc" }, take: 15,
    select: { sku: true, stockQuantity: true, product: { select: { name: true } } },
  });
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="label-mono text-forest-500">Ops</p>
      <h1 className="mt-2 text-3xl font-semibold">Low-stock alerts</h1>
      <table className="mt-8 w-full text-sm">
        <thead><tr className="label-mono text-left text-slate-400"><th className="py-2">SKU</th><th>Product</th><th className="text-right">Qty</th></tr></thead>
        <tbody>{lowStock.map((v) => (
          <tr key={v.sku} className="border-t border-slate-900/10"><td className="py-2 font-mono text-xs">{v.sku}</td><td>{v.product.name}</td><td className={`text-right font-mono ${v.stockQuantity === 0 ? "text-signal" : ""}`}>{v.stockQuantity}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}
