"use client";

import { Check } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useUrlFilters } from "./use-url-filters";

export interface Facets {
  subcategories: { slug: string; name: string }[];
  sizes: string[];
  colors: { color: string; colorHex: string }[];
  materials: string[];
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-slate-900/10 py-5">
      <legend className="label-mono mb-3 text-slate-800">{title}</legend>
      {children}
    </fieldset>
  );
}

export function FilterSidebar({ facets, showGender }: { facets: Facets; showGender: boolean }) {
  const { getList, toggle, set, clear, params, isPending } = useUrlFilters();
  const [min, setMin] = useState(params.get("min") ? String(Number(params.get("min")) / 100) : "");
  const [max, setMax] = useState(params.get("max") ? String(Number(params.get("max")) / 100) : "");

  // Debounce price inputs so typing doesn't spam navigations.
  useEffect(() => {
    const t = setTimeout(() => {
      const toCents = (v: string) => (v && Number(v) >= 0 ? String(Math.round(Number(v) * 100)) : null);
      if (toCents(min) !== params.get("min")) set("min", toCents(min));
      else if (toCents(max) !== params.get("max")) set("max", toCents(max));
    }, 500);
    return () => clearTimeout(t);
  }, [min, max, params, set]);

  const activeCount = ["sub", "size", "color", "material", "gender", "min", "max"].filter((k) => params.has(k)).length;

  return (
    <aside className={cn("transition-opacity", isPending && "opacity-60")} aria-busy={isPending}>
      <div className="flex items-center justify-between pb-4">
        <p className="label-mono">Filters{activeCount > 0 && ` (${activeCount})`}</p>
        {activeCount > 0 && <button onClick={() => { setMin(""); setMax(""); clear(); }} className="label-mono text-slate-400 hover:text-slate-900">Clear all</button>}
      </div>

      {facets.subcategories.length > 0 && (
        <Group title="Category">
          <ul className="space-y-2">
            {facets.subcategories.map((c) => {
              const on = getList("sub").includes(c.slug);
              return (
                <li key={c.slug}>
                  <button onClick={() => toggle("sub", c.slug)} className="flex items-center gap-3 text-sm" aria-pressed={on}>
                    <span className={cn("grid size-4 place-items-center ring-1 ring-slate-900/30", on && "bg-slate-900 ring-slate-900")}>{on && <Check className="size-3 text-bone-50" />}</span>
                    {c.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </Group>
      )}

      {showGender && (
        <Group title="Fit">
          <div className="flex gap-2">
            {(["MEN", "WOMEN"] as const).map((g) => (
              <button key={g} onClick={() => set("gender", params.get("gender") === g ? null : g)} aria-pressed={params.get("gender") === g}
                className={cn("label-mono px-3 py-2 ring-1 ring-slate-900/20", params.get("gender") === g && "bg-slate-900 text-bone-50")}>{g}</button>
            ))}
          </div>
        </Group>
      )}

      <Group title="Size">
        <div className="grid grid-cols-4 gap-1.5">
          {facets.sizes.map((s) => {
            const on = getList("size").includes(s);
            return (
              <button key={s} onClick={() => toggle("size", s)} aria-pressed={on}
                className={cn("h-9 font-mono text-xs ring-1 ring-inset ring-slate-900/15 transition-colors hover:ring-slate-900", on && "bg-slate-900 text-bone-50")}>{s}</button>
            );
          })}
        </div>
      </Group>

      <Group title="Color">
        <div className="flex flex-wrap gap-2">
          {facets.colors.map((c) => {
            const on = getList("color").includes(c.color);
            return (
              <button key={c.color} onClick={() => toggle("color", c.color)} aria-pressed={on} title={c.color}
                className={cn("size-7 rounded-full ring-offset-2 ring-offset-bone-50 transition", on ? "ring-2 ring-slate-900" : "ring-1 ring-slate-900/15")}
                style={{ backgroundColor: c.colorHex }}><span className="sr-only">{c.color}</span></button>
            );
          })}
        </div>
      </Group>

      <Group title="Material">
        <ul className="space-y-2">
          {facets.materials.map((m) => {
            const on = getList("material").includes(m);
            return (
              <li key={m}>
                <button onClick={() => toggle("material", m)} className="flex items-center gap-3 text-sm" aria-pressed={on}>
                  <span className={cn("grid size-4 place-items-center ring-1 ring-slate-900/30", on && "bg-slate-900 ring-slate-900")}>{on && <Check className="size-3 text-bone-50" />}</span>
                  {m}
                </button>
              </li>
            );
          })}
        </ul>
      </Group>

      <Group title="Price (USD)">
        <div className="flex items-center gap-2">
          {[[min, setMin, "Min"], [max, setMax, "Max"]].map(([v, setV, ph]) => (
            <input key={ph as string} inputMode="numeric" placeholder={ph as string} value={v as string}
              onChange={(e) => (setV as (s: string) => void)(e.target.value.replace(/[^\d.]/g, ""))}
              className="h-10 w-full bg-transparent px-3 font-mono text-sm ring-1 ring-inset ring-slate-900/15 focus:ring-slate-900" />
          ))}
        </div>
      </Group>
    </aside>
  );
}

export function SortSelect() {
  const { params, set } = useUrlFilters();
  return (
    <label className="flex items-center gap-2">
      <span className="label-mono text-slate-400">Sort</span>
      <select value={params.get("sort") ?? "featured"} onChange={(e) => set("sort", e.target.value === "featured" ? null : e.target.value)}
        className="label-mono bg-transparent py-1 pr-6 focus:outline-none">
        <option value="featured">Featured</option>
        <option value="price-asc">Price: low → high</option>
        <option value="price-desc">Price: high → low</option>
        <option value="eco">Eco score</option>
        <option value="newest">Newest</option>
      </select>
    </label>
  );
}
