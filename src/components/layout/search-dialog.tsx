"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState, type KeyboardEvent } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { fetchSuggestions } from "@/features/search/suggest";
import { cn, formatPrice } from "@/lib/utils";
import { Portal } from "./portal";
import { useDialog } from "./use-dialog";

const POPULAR = ["Merino Wool", "Tempo Runner", "Stormline", "Hoodie", "Weekender"];
const MIN_CHARS = 2;
const DEBOUNCE_MS = 220;

/** The value, `delay` ms after it last changed. */
function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const pathname = usePathname();
  useEffect(() => close(), [pathname, close]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search products" aria-haspopup="dialog" className="grid size-11 place-items-center rounded-full transition-colors hover:bg-slate/5">
        <Search className="size-[19px]" aria-hidden />
      </button>
      <Portal>
        <AnimatePresence>{open && <SearchPanel close={close} />}</AnimatePresence>
      </Portal>
    </>
  );
}

/**
 * Search overlay: a combobox. Typing fetches ranked suggestions (debounced,
 * cached by TanStack Query); arrow keys move through them, Enter opens the
 * highlighted product, or the full results page when nothing is highlighted.
 */
function SearchPanel({ close }: { close: () => void }) {
  const panelRef = useDialog<HTMLDivElement>(true, close);
  const router = useRouter();
  const listId = useId();
  const [text, setText] = useState("");
  const [active, setActive] = useState(-1);
  const query = useDebounced(text.trim(), DEBOUNCE_MS);
  const enabled = query.length >= MIN_CHARS;

  const { data: suggestions = [], isFetching, isError } = useQuery({
    queryKey: ["search-suggest", query.toLowerCase()],
    queryFn: ({ signal }) => fetchSuggestions(query, signal),
    enabled,
    staleTime: 60_000,
    placeholderData: (previous) => previous,
  });
  const shown = enabled ? suggestions : [];
  const highlighted = active >= 0 && active < shown.length ? active : -1;

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!shown.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((highlighted + 1) % shown.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(highlighted <= 0 ? shown.length - 1 : highlighted - 1);
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      router.push(`/products/${shown[highlighted]!.slug}`);
    }
  }

  const status = !enabled ? "" : isError ? "Search is unavailable right now." : isFetching && !shown.length ? "Searching…" : shown.length ? `${shown.length} suggestion${shown.length === 1 ? "" : "s"}` : "No matches. Press Enter to search everything.";

  return (
    <>
      <motion.div key="scrim" className="fixed inset-0 z-50 bg-slate/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={close} aria-hidden />
      <motion.div
        key="panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto rounded-b-[28px] bg-bone pb-8 pt-5 shadow-[0_30px_60px_-30px_rgba(28,34,38,.5)]"
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 34 }}
      >
        <div className="container-page max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="label-mono text-muted">Search the catalog</p>
            <button type="button" onClick={close} aria-label="Close search" className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-slate/5">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <form action="/search" method="get" role="search" className="mt-2 flex items-center gap-3 border-b border-line-strong pb-3">
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <Search className="size-6 shrink-0 text-muted" aria-hidden />
            <input
              id="site-search"
              name="q"
              type="search"
              data-autofocus
              placeholder="Runners, merino, boots…"
              autoComplete="off"
              required
              minLength={MIN_CHARS}
              maxLength={80}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setActive(-1);
              }}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded={shown.length > 0}
              aria-controls={listId}
              aria-autocomplete="list"
              aria-activedescendant={highlighted >= 0 ? `${listId}-${highlighted}` : undefined}
              className="min-w-0 flex-1 bg-transparent font-serif text-[clamp(28px,6vw,44px)] leading-tight placeholder:text-muted/70 focus:outline-none"
            />
            <button type="submit" aria-label="Submit search" className="grid size-11 shrink-0 place-items-center rounded-full bg-slate text-bone transition-colors hover:bg-forest">
              <ArrowRight className="size-5" aria-hidden />
            </button>
          </form>

          <p role="status" aria-live="polite" className={cn("label-mono mt-3 min-h-5 text-muted", !status && "sr-only")}>{status}</p>

          <ul id={listId} role="listbox" aria-label="Suggestions" className={cn("mt-2 divide-y divide-line", shown.length === 0 && "hidden")}>
            {shown.map((s, i) => (
              <li key={s.slug} id={`${listId}-${i}`} role="option" aria-selected={i === highlighted}>
                <Link
                  href={`/products/${s.slug}`}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  className={cn("flex items-center gap-4 rounded-[14px] px-2 py-3 transition-colors", i === highlighted ? "bg-sand" : "hover:bg-sand/60")}
                >
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-sand">
                    {s.image && <ProductImage src={s.image} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{s.name}</span>
                    <span className="label-mono text-muted">{s.gender === "MEN" ? "Men · " : s.gender === "WOMEN" ? "Women · " : ""}{s.category}</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatPrice(s.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {enabled && (
            <Link href={`/search?q=${encodeURIComponent(query)}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline">
              See all results for &ldquo;{query}&rdquo; <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}

          {!enabled && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Popular searches">
              {POPULAR.map((s) => (
                <li key={s}>
                  <Link href={`/search?q=${encodeURIComponent(s)}`} className="inline-flex h-9 items-center rounded-full px-4 text-sm ring-1 ring-inset ring-line-strong transition-colors hover:bg-slate hover:text-bone">{s}</Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </>
  );
}
