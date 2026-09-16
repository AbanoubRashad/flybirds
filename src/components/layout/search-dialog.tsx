"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Portal } from "./portal";
import { useDialog } from "./use-dialog";

const SUGGESTIONS = ["Merino Wool", "Tempo Runner", "Stormline", "Hoodie", "Weekender"];

export function SearchButton() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const panelRef = useDialog<HTMLDivElement>(open, close);
  const pathname = usePathname();
  useEffect(() => close(), [pathname, close]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search products" aria-haspopup="dialog" className="grid size-11 place-items-center rounded-full transition-colors hover:bg-slate/5">
        <Search className="size-[19px]" aria-hidden />
      </button>

      <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="scrim" className="fixed inset-0 z-50 bg-slate/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={close} aria-hidden />
            <motion.div
              key="panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              className="fixed inset-x-0 top-0 z-50 rounded-b-[28px] bg-bone pb-8 pt-5 shadow-[0_30px_60px_-30px_rgba(28,34,38,.5)]"
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
                  <input id="site-search" name="q" type="search" data-autofocus placeholder="Runners, merino, boots…" autoComplete="off" required minLength={2}
                    className="min-w-0 flex-1 bg-transparent font-serif text-[clamp(28px,6vw,44px)] leading-tight placeholder:text-muted/70 focus:outline-none" />
                  <button type="submit" aria-label="Submit search" className="grid size-11 shrink-0 place-items-center rounded-full bg-slate text-bone transition-colors hover:bg-forest">
                    <ArrowRight className="size-5" aria-hidden />
                  </button>
                </form>
                <ul className="mt-5 flex flex-wrap gap-2" aria-label="Popular searches">
                  {SUGGESTIONS.map((s) => (
                    <li key={s}>
                      <Link href={`/search?q=${encodeURIComponent(s)}`} className="inline-flex h-9 items-center rounded-full px-4 text-sm ring-1 ring-inset ring-line-strong transition-colors hover:bg-slate hover:text-bone">{s}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </Portal>
    </>
  );
}
