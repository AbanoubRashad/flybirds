"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/utils";
import type { RevenuePoint } from "@/server/queries/admin";

const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const label = (day: string) => dayLabel.format(new Date(`${day}T00:00:00Z`));

/** Daily revenue (paid + shipped orders). One series, so no legend: the heading names it. */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const total = data.reduce((n, d) => n + d.revenue, 0);
  if (total === 0) {
    return <p className="grid h-[280px] place-items-center rounded-[20px] bg-sand/60 text-muted">No paid orders in this period yet.</p>;
  }
  return (
    <figure>
      <div className="h-[280px] w-full" role="img" aria-label={`Daily revenue for the last ${data.length} days, ${formatPrice(total)} in total`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3E5641" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#3E5641" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#1C2226" strokeOpacity={0.08} />
            <XAxis dataKey="day" tickFormatter={label} tickLine={false} axisLine={false} minTickGap={32} tick={{ fontSize: 12, fill: "#5B6468" }} />
            <YAxis tickFormatter={(v: number) => `$${Math.round(v / 100)}`} tickLine={false} axisLine={false} width={52} tick={{ fontSize: 12, fill: "#5B6468" }} />
            <Tooltip
              cursor={{ stroke: "#1C2226", strokeOpacity: 0.2 }}
              contentStyle={{ borderRadius: 12, border: "1px solid rgba(28,34,38,.12)", background: "#F6F3EC", fontSize: 13 }}
              labelFormatter={(day) => label(String(day))}
              formatter={(value, _name, item) => [`${formatPrice(Number(value))} · ${(item.payload as RevenuePoint).orders} order${(item.payload as RevenuePoint).orders === 1 ? "" : "s"}`, "Revenue"]}
            />
            <Area type="monotone" dataKey="revenue" stroke="#3E5641" strokeWidth={2} fill="url(#revenue-fill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {/* The same numbers as a table, for screen readers and anyone who prefers rows. */}
      <details className="mt-3 text-sm">
        <summary className="label-mono cursor-pointer py-2 text-muted">Show the numbers</summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-[14px] ring-1 ring-inset ring-line">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-sand">
              <tr className="label-mono text-muted">
                <th scope="col" className="px-4 py-2 font-normal">Day</th>
                <th scope="col" className="px-4 py-2 text-right font-normal">Orders</th>
                <th scope="col" className="px-4 py-2 text-right font-normal">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.filter((d) => d.orders > 0).map((d) => (
                <tr key={d.day}>
                  <th scope="row" className="px-4 py-2 font-normal">{label(d.day)}</th>
                  <td className="px-4 py-2 text-right tabular-nums">{d.orders}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{formatPrice(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
