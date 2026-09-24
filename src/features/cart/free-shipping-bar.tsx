"use client";

import { motion } from "framer-motion";
import { EXPRESS_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/utils";

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const target = subtotal < FREE_SHIPPING_THRESHOLD ? FREE_SHIPPING_THRESHOLD : EXPRESS_SHIPPING_THRESHOLD;
  const remaining = Math.max(0, target - subtotal);
  const pct = Math.min(100, (subtotal / EXPRESS_SHIPPING_THRESHOLD) * 100);
  const freeMark = (FREE_SHIPPING_THRESHOLD / EXPRESS_SHIPPING_THRESHOLD) * 100;

  const message =
    remaining === 0
      ? "Free Express Shipping unlocked."
      : target === FREE_SHIPPING_THRESHOLD
        ? `Add ${formatPrice(remaining)} more for Free Standard Shipping`
        : `Free shipping unlocked · add ${formatPrice(remaining)} for Free Express`;

  return (
    <div className="space-y-2" aria-live="polite">
      <p className="label-mono text-slate-800">{message}</p>
      <div className="relative h-1.5 overflow-hidden bg-slate-900/10">
        <motion.div className="absolute inset-y-0 left-0 bg-forest-500" initial={false} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
        <span className="absolute inset-y-0 w-px bg-bone-50" style={{ left: `${freeMark}%` }} />
      </div>
    </div>
  );
}
