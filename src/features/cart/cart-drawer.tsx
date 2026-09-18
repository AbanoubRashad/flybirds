"use client";

import { AnimatePresence, motion, useAnimate } from "framer-motion";
import { ArrowRight, Minus, Plus, ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { useDialog } from "@/components/layout/use-dialog";
import { formatPrice } from "@/lib/utils";
import { FreeShippingBar } from "./free-shipping-bar";
import { selectCount, selectSubtotal, useCart } from "./store";
import { useCartSync } from "./use-cart-sync";

const useHydrated = () => useSyncExternalStore(() => () => {}, () => true, () => false);

const roundBtn = "grid size-9 place-items-center rounded-full ring-1 ring-inset ring-line-strong transition-colors hover:bg-slate hover:text-bone hover:ring-slate disabled:pointer-events-none disabled:opacity-30";

export function CartDrawer() {
  const hydrated = useHydrated();
  const { isOpen, lines, setQuantity, remove } = useCart();
  const closeCart = useCart((s) => s.close);
  const close = useCallback(() => closeCart(), [closeCart]);
  const count = useCart(selectCount);
  const subtotal = useCart(selectSubtotal);
  const { isSyncing, notices, dismiss } = useCartSync();
  const panelRef = useDialog<HTMLElement>(isOpen, close);

  if (!hydrated) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="scrim" className="fixed inset-0 z-50 bg-slate/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} onClick={close} aria-hidden />
          <motion.aside
            key="panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col bg-bone shadow-[-30px_0_60px_-30px_rgba(28,34,38,.45)] sm:rounded-l-[28px]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 36 }}
          >
            <header className="flex items-center justify-between px-6 pb-4 pt-6">
              <div className="flex items-baseline gap-3">
                <h2 id="cart-title" className="display text-[40px]">Your cart</h2>
                <span className="label-mono text-muted" aria-live="polite">
                  {count} {count === 1 ? "item" : "items"}{isSyncing && " · syncing"}
                </span>
              </div>
              <button type="button" onClick={close} aria-label="Close cart" data-autofocus className="-mr-2 grid size-11 place-items-center rounded-full transition-colors hover:bg-slate/5">
                <X className="size-5" aria-hidden />
              </button>
            </header>

            <div className="mx-6 rounded-[18px] bg-sand/70 px-5 py-4"><FreeShippingBar subtotal={subtotal} /></div>

            <AnimatePresence>
              {notices.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mx-6 mt-3 flex items-start justify-between gap-3 rounded-[14px] bg-slate px-4 py-3 text-sm text-bone" role="alert">
                  <ul className="space-y-1">{notices.map((n) => <li key={n}>{n}</li>)}</ul>
                  <button type="button" onClick={dismiss} aria-label="Dismiss notice" className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-bone/10"><X className="size-4" aria-hidden /></button>
                </motion.div>
              )}
            </AnimatePresence>

            {lines.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
                <span className="grid size-20 place-items-center rounded-full bg-sand"><ShoppingBag className="size-8 text-forest" aria-hidden /></span>
                <div>
                  <p className="display text-[32px]">Nothing packed yet.</p>
                  <p className="mt-2 text-sm text-muted">Every pair ships with a 30-day wear test — take them on the long way round.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button asChild onClick={close}><Link href="/collections/mens-footwear">Shop men</Link></Button>
                  <Button asChild variant="outline" onClick={close}><Link href="/collections/womens-footwear">Shop women</Link></Button>
                </div>
              </motion.div>
            ) : (
              <ul className="mt-2 flex-1 overflow-y-auto overscroll-contain px-6" aria-label="Cart items">
                <AnimatePresence initial={false} mode="popLayout">
                  {lines.map((l) => (
                    <motion.li
                      key={l.variantId}
                      layout
                      initial={{ opacity: 0, y: -12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 48 }}
                      transition={{ duration: 0.35 }}
                      className="flex gap-4 border-b border-line py-5 last:border-b-0"
                    >
                      <Link href={`/products/${l.productSlug}?color=${encodeURIComponent(l.color)}`} onClick={close} className="relative size-[92px] shrink-0 overflow-hidden rounded-[14px] bg-sand">
                        <ProductImage src={l.image} alt={`${l.name} in ${l.color}`} fill sizes="92px" className="object-cover" />
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex justify-between gap-3">
                          <p className="font-semibold leading-snug">{l.name}</p>
                          <p className="shrink-0 tabular-nums">{formatPrice(l.unitPrice * l.quantity)}</p>
                        </div>
                        <p className="label-mono mt-1 text-muted">{l.color} · Size {l.size}</p>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="flex items-center gap-1">
                            <button type="button" className={roundBtn} onClick={() => setQuantity(l.variantId, l.quantity - 1)} aria-label={`Decrease quantity of ${l.name}`}><Minus className="size-3.5" aria-hidden /></button>
                            <span className="relative grid h-9 w-9 place-items-center overflow-hidden font-mono text-sm tabular-nums" aria-live="polite" aria-label={`Quantity ${l.quantity}`}>
                              <AnimatePresence mode="popLayout" initial={false}>
                                <motion.span key={l.quantity} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.25 }}>{l.quantity}</motion.span>
                              </AnimatePresence>
                            </span>
                            <button type="button" className={roundBtn} disabled={l.quantity >= Math.min(l.maxQuantity, 10)} onClick={() => setQuantity(l.variantId, l.quantity + 1)} aria-label={`Increase quantity of ${l.name}`}><Plus className="size-3.5" aria-hidden /></button>
                          </div>
                          <button type="button" className="label-mono py-2 text-muted underline-offset-4 hover:text-slate hover:underline" onClick={() => remove(l.variantId)}>
                            Remove<span className="sr-only"> {l.name}</span>
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}

            {lines.length > 0 && (
              <footer className="space-y-4 border-t border-line px-6 pb-6 pt-5">
                <div className="flex items-baseline justify-between">
                  <span className="label-mono text-muted">Subtotal</span>
                  <span className="font-serif text-[30px] leading-none tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                {/* Stripe Checkout Session server action lands in Phase 2 */}
                <Button size="lg" variant="forest" className="group w-full" disabled={isSyncing}>
                  Checkout <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </Button>
                <p className="label-mono text-center text-muted">Free returns · 30-day wear test</p>
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export function CartButton() {
  const hydrated = useHydrated();
  const count = useCart(selectCount);
  const open = useCart((s) => s.open);
  const shown = hydrated ? count : 0;
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const prev = useRef(shown);

  // Pop the badge only when the count goes up (an item was added).
  useEffect(() => {
    if (hydrated && shown > prev.current && scope.current) {
      void animate(scope.current, { scale: [1, 1.35, 1] }, { duration: 0.45, ease: [0.16, 1, 0.3, 1] });
    }
    prev.current = shown;
  }, [shown, hydrated, animate, scope]);

  return (
    <button
      type="button"
      onClick={open}
      aria-label={`Open cart, ${shown} ${shown === 1 ? "item" : "items"}`}
      className="flex h-11 items-center gap-2.5 rounded-full bg-slate pl-5 pr-2 text-sm font-semibold text-bone transition-colors hover:bg-forest"
    >
      <span className="hidden sm:inline">Cart</span>
      <ShoppingBag className="size-4 sm:hidden" aria-hidden />
      <span ref={scope} className="grid h-7 min-w-7 place-items-center rounded-full bg-ember px-1.5 font-mono text-xs font-medium text-slate tabular-nums">
        {shown}
      </span>
    </button>
  );
}
