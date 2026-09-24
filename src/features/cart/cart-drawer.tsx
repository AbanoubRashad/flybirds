"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { FreeShippingBar } from "./free-shipping-bar";
import { selectCount, selectSubtotal, useCart } from "./store";
import { useCartSync } from "./use-cart-sync";

const useHydrated = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export function CartDrawer() {
  const hydrated = useHydrated();
  const { isOpen, close, lines, setQuantity, remove } = useCart();
  const count = useCart(selectCount);
  const subtotal = useCart(selectSubtotal);
  const { isSyncing, notices, dismiss } = useCartSync();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [isOpen, close]);

  if (!hydrated) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="scrim" className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside
            key="panel" role="dialog" aria-modal="true" aria-label="Shopping cart"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-bone-50 shadow-2xl"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
          >
            <header className="flex items-center justify-between border-b border-slate-900/10 px-6 py-5">
              <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-semibold">Your cart</h2>
                <span className="label-mono text-slate-400">{count} {count === 1 ? "item" : "items"}{isSyncing && " · syncing"}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={close} aria-label="Close cart"><X className="size-5" /></Button>
            </header>

            <div className="border-b border-slate-900/10 px-6 py-4"><FreeShippingBar subtotal={subtotal} /></div>

            <AnimatePresence>
              {notices.length > 0 && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden bg-signal/15">
                  <div className="flex items-start justify-between gap-3 px-6 py-3 text-sm">
                    <ul>{notices.map((n) => <li key={n}>{n}</li>)}</ul>
                    <button onClick={dismiss} aria-label="Dismiss"><X className="size-4" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ul className="flex-1 overflow-y-auto px-6">
              <AnimatePresence initial={false} mode="popLayout">
                {lines.map((l) => (
                  <motion.li key={l.variantId} layout initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.25 }} className="flex gap-4 border-b border-slate-900/10 py-5">
                    <Link href={`/products/${l.productSlug}`} onClick={close} className="relative size-24 shrink-0 overflow-hidden bg-bone-100">
                      <Image src={l.image} alt={l.name} fill sizes="96px" className="object-cover" unoptimized />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <p className="font-medium leading-tight">{l.name}</p>
                        <p className="tabular-nums">{formatPrice(l.unitPrice * l.quantity)}</p>
                      </div>
                      <p className="label-mono mt-1 text-slate-400">{l.color} / {l.size}</p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center ring-1 ring-slate-900/15">
                          <button className="grid size-8 place-items-center hover:bg-slate-900/5" onClick={() => setQuantity(l.variantId, l.quantity - 1)} aria-label="Decrease quantity"><Minus className="size-3" /></button>
                          <motion.span key={l.quantity} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-8 text-center font-mono text-sm tabular-nums">{l.quantity}</motion.span>
                          <button className="grid size-8 place-items-center hover:bg-slate-900/5 disabled:opacity-30" disabled={l.quantity >= l.maxQuantity} onClick={() => setQuantity(l.variantId, l.quantity + 1)} aria-label="Increase quantity"><Plus className="size-3" /></button>
                        </div>
                        <button className="label-mono text-slate-400 underline-offset-4 hover:text-slate-900 hover:underline" onClick={() => remove(l.variantId)}>Remove</button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
              {lines.length === 0 && (
                <li className="flex h-full flex-col items-center justify-center gap-4 py-20 text-center">
                  <p className="label-mono text-slate-400">Cart is empty</p>
                  <Button variant="secondary" onClick={close} asChild><Link href="/collections/mens-footwear">Shop footwear</Link></Button>
                </li>
              )}
            </ul>

            {lines.length > 0 && (
              <footer className="space-y-4 border-t border-slate-900/10 px-6 py-5">
                <div className="flex justify-between"><span className="label-mono">Subtotal</span><span className="font-semibold tabular-nums">{formatPrice(subtotal)}</span></div>
                {/* Stripe Checkout Session server action lands in Phase 2 */}
                <Button size="lg" className="w-full" disabled={isSyncing}>Checkout</Button>
                <p className="label-mono text-center text-slate-400">Taxes & shipping calculated at checkout</p>
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
  return (
    <button onClick={open} className="relative flex items-center gap-2 px-2 py-1" aria-label={`Open cart, ${count} items`}>
      <span className="label-mono">Cart</span>
      <AnimatePresence mode="popLayout">
        <motion.span key={hydrated ? count : "x"} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid h-5 min-w-5 place-items-center bg-slate-900 px-1 font-mono text-[10px] text-bone-50">
          {hydrated ? count : 0}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
