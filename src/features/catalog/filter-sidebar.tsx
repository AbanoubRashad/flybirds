"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useDialog } from "@/components/layout/use-dialog";
import { cn } from "@/lib/utils";
import { useUrlFilters } from "./use-url-filters";

export interface Facets {
  subcategories: { slug: string; name: string }[];
  sizes: string[];
  colors: { color: string; colorHex: string }[];
  materials: string[];
}

const FILTER_KEYS = ["sub", "size", "color", "material", "gender", "min", "max"];

const pill = (on: boolean) =>
  cn(
    "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 ring-inset transition-colors duration-300",
    on ? "bg-slate text-bone ring-slate" : "ring-line-strong hover:ring-slate",
  );

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <legend className="label-mono float-left mb-4 w-full text-slate">{title}</legend>
      <div className="clear-left">{children}</div>
    </fieldset>
  );
}

interface PriceState {
  min: string;
  max: string;
  setMin: (v: string) => void;
  setMax: (v: string) => void;
}

/** Price inputs are local while typing and debounced into the URL. Lives in the parent so desktop + sheet share one copy. */
function usePriceFilter(): PriceState {
  const { set, params } = useUrlFilters();
  const [min, setMin] = useState(params.get("min") ? String(Number(params.get("min")) / 100) : "");
  const [max, setMax] = useState(params.get("max") ? String(Number(params.get("max")) / 100) : "");

  useEffect(() => {
    const t = setTimeout(() => {
      const toCents = (v: string) => (v && Number(v) >= 0 ? String(Math.round(Number(v) * 100)) : null);
      if (toCents(min) !== params.get("min")) set("min", toCents(min));
      else if (toCents(max) !== params.get("max")) set("max", toCents(max));
    }, 500);
    return () => clearTimeout(t);
  }, [min, max, params, set]);

  // When a bound disappears from the URL (Clear all, back button), empty its input too.
  const prev = useRef(params);
  useEffect(() => {
    if (prev.current.has("min") && !params.has("min")) setMin("");
    if (prev.current.has("max") && !params.has("max")) setMax("");
    prev.current = params;
  }, [params]);

  return { min, max, setMin, setMax };
}

function FilterPanel({ facets, showGender, price }: { facets: Facets; showGender: boolean; price: PriceState }) {
  const { getList, toggle, set, params } = useUrlFilters();
  const { min, max, setMin, setMax } = price;

  return (
    <div>
      {facets.subcategories.length > 0 && (
        <Group title="Category">
          <div className="flex flex-wrap gap-2">
            {facets.subcategories.map((c) => {
              const on = getList("sub").includes(c.slug);
              return (
                <button key={c.slug} type="button" onClick={() => toggle("sub", c.slug)} aria-pressed={on} className={pill(on)}>
                  {on && <Check className="size-3.5" aria-hidden />}{c.name}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {showGender && (
        <Group title="Fit">
          <div className="flex gap-2">
            {(["MEN", "WOMEN"] as const).map((g) => {
              const on = params.get("gender") === g;
              return (
                <button key={g} type="button" onClick={() => set("gender", on ? null : g)} aria-pressed={on} className={pill(on)}>
                  {g === "MEN" ? "Men's" : "Women's"}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      <Group title="Size">
        <div className="grid grid-cols-4 gap-2">
          {facets.sizes.map((s) => {
            const on = getList("size").includes(s);
            return (
              <button key={s} type="button" onClick={() => toggle("size", s)} aria-pressed={on}
                className={cn("h-10 rounded-full font-mono text-xs ring-1 ring-inset transition-colors duration-300", on ? "bg-slate text-bone ring-slate" : "ring-line-strong hover:ring-slate")}>
                {s}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Colour">
        <div className="flex flex-wrap gap-1">
          {facets.colors.map((c) => {
            const on = getList("color").includes(c.color);
            return (
              <button key={c.color} type="button" onClick={() => toggle("color", c.color)} aria-pressed={on} title={c.color}
                className={cn("flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-sm ring-1 ring-inset transition-colors duration-300", on ? "bg-slate text-bone ring-slate" : "ring-transparent hover:ring-line-strong")}>
                <span className="size-6 rounded-full ring-1 ring-inset ring-slate/15" style={{ backgroundColor: c.colorHex }} aria-hidden />
                {c.color}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Material">
        <div className="flex flex-wrap gap-2">
          {facets.materials.map((m) => {
            const on = getList("material").includes(m);
            return (
              <button key={m} type="button" onClick={() => toggle("material", m)} aria-pressed={on} className={pill(on)}>
                {on && <Check className="size-3.5" aria-hidden />}{m}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Price (USD)">
        <div className="flex items-center gap-2">
          {([["min", min, setMin, "Min"], ["max", max, setMax, "Max"]] as const).map(([key, v, setV, label]) => (
            <label key={key} className="relative flex-1">
              <span className="sr-only">{label} price</span>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted" aria-hidden>$</span>
              <input inputMode="decimal" placeholder={label} value={v}
                onChange={(e) => setV(e.target.value.replace(/[^\d.]/g, ""))}
                className="h-11 w-full rounded-full bg-transparent pl-8 pr-4 font-mono text-sm ring-1 ring-inset ring-line-strong placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-slate" />
            </label>
          ))}
        </div>
      </Group>
    </div>
  );
}

/** Desktop: sticky sidebar. Mobile: a "Filters" pill that opens the same panel as a bottom sheet. */
export function FilterSidebar({ facets, showGender }: { facets: Facets; showGender: boolean }) {
  const { params, clear, isPending } = useUrlFilters();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const sheetRef = useDialog<HTMLDivElement>(open, close);
  const activeCount = FILTER_KEYS.filter((k) => params.has(k)).length;
  const price = usePriceFilter();
  const clearAll = () => { price.setMin(""); price.setMax(""); clear(); };

  const header = (
    <div className="flex items-center justify-between pb-6">
      <p className="label-mono">Filters{activeCount > 0 && ` · ${activeCount}`}</p>
      {activeCount > 0 && <button type="button" onClick={clearAll} className="label-mono text-muted underline-offset-4 hover:text-slate hover:underline">Clear all</button>}
    </div>
  );

  return (
    <>
      <aside aria-label="Filters" aria-busy={isPending} className={cn("hidden transition-opacity lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pb-8 lg:pr-2", isPending && "opacity-60")}>
        {header}
        <FilterPanel facets={facets} showGender={showGender} price={price} />
      </aside>

      <div className="lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold ring-1 ring-inset ring-line-strong">
          <SlidersHorizontal className="size-4" aria-hidden />
          Filters
          {activeCount > 0 && <span className="grid size-6 place-items-center rounded-full bg-slate font-mono text-xs text-bone">{activeCount}</span>}
          <ChevronDown className="size-4 text-muted" aria-hidden />
        </button>
        <AnimatePresence>
          {open && (
            <>
              <motion.div key="scrim" className="fixed inset-0 z-50 bg-slate/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} aria-hidden />
              <motion.div key="sheet" ref={sheetRef} role="dialog" aria-modal="true" aria-label="Filters"
                className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[28px] bg-bone"
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 36 }}>
                <div className="flex items-center justify-between px-5 pb-2 pt-4">
                  <p className="display text-[32px]">Filters</p>
                  <button type="button" onClick={close} aria-label="Close filters" data-autofocus className="grid size-11 place-items-center rounded-full hover:bg-slate/5"><X className="size-5" aria-hidden /></button>
                </div>
                <div className={cn("flex-1 overflow-y-auto px-5 pt-2 transition-opacity", isPending && "opacity-60")}>
                  <FilterPanel facets={facets} showGender={showGender} price={price} />
                </div>
                <div className="flex gap-2 border-t border-line px-5 py-4">
                  <button type="button" onClick={clearAll} disabled={activeCount === 0} className="h-12 flex-1 rounded-full text-sm font-semibold ring-1 ring-inset ring-line-strong disabled:opacity-40">Clear all</button>
                  <button type="button" onClick={close} className="h-12 flex-[2] rounded-full bg-slate text-sm font-semibold text-bone hover:bg-forest">Show results</button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

export function SortSelect() {
  const { params, set } = useUrlFilters();
  return (
    <label className="relative inline-flex items-center self-start md:self-auto">
      <span className="sr-only">Sort products</span>
      <select value={params.get("sort") ?? "featured"} onChange={(e) => set("sort", e.target.value === "featured" ? null : e.target.value)}
        className="h-11 cursor-pointer appearance-none rounded-full bg-transparent pl-5 pr-11 text-sm font-semibold ring-1 ring-inset ring-line-strong hover:ring-slate focus:outline-none focus-visible:ring-2 focus-visible:ring-forest">
        <option value="featured">Sort: Featured</option>
        <option value="price-asc">Price: low → high</option>
        <option value="price-desc">Price: high → low</option>
        <option value="eco">Eco score</option>
        <option value="newest">Newest</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 size-4 text-muted" aria-hidden />
    </label>
  );
}
