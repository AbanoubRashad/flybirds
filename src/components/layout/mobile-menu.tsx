"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { EASE } from "@/lib/motion";
import { Logo } from "./logo";
import { Portal } from "./portal";
import { MATERIALS_HREF, NAV } from "./nav";
import { useDialog } from "./use-dialog";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const panelRef = useDialog<HTMLDivElement>(open, close);
  const pathname = usePathname();
  useEffect(() => close(), [pathname, close]);

  const links = [...NAV, { label: "Our materials", href: MATERIALS_HREF }];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="-ml-2 grid size-11 place-items-center rounded-full transition-colors hover:bg-slate/5 lg:hidden"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <Portal>
      <AnimatePresence>
        {open && (
          <>
            <motion.div key="scrim" className="fixed inset-0 z-50 bg-slate/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={close} aria-hidden />
            <motion.div
              key="sheet"
              id="mobile-menu"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="fixed inset-y-0 left-0 z-50 flex w-[min(88vw,380px)] flex-col bg-bone px-6 pb-8"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 36 }}
            >
              <div className="flex h-[76px] items-center justify-between">
                <Logo />
                <button type="button" onClick={close} aria-label="Close menu" data-autofocus className="-mr-2 grid size-11 place-items-center rounded-full hover:bg-slate/5">
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <nav aria-label="Mobile" className="mt-6 flex-1">
                <ul className="divide-y divide-line border-y border-line">
                  {links.map((l, i) => (
                    <motion.li key={l.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 + i * 0.05, duration: 0.6, ease: EASE }}>
                      <Link href={l.href} onClick={close} className="flex items-center justify-between py-4 font-serif text-[34px] leading-none">
                        {l.label}
                        <ArrowUpRight className="size-5 text-muted" aria-hidden />
                      </Link>
                    </motion.li>
                  ))}
                </ul>
              </nav>
              <div className="space-y-2">
                <Link href="/sign-in" onClick={close} className="label-mono block py-2 text-muted hover:text-slate">Sign in</Link>
                <p className="label-mono text-muted">Free shipping over $75 · 30-day wear test</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </Portal>
    </>
  );
}
