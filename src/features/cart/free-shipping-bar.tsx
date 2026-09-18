"use client";

import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { EXPRESS_SHIPPING_THRESHOLD, FREE_SHIPPING_THRESHOLD, formatPrice } from "@/lib/utils";

export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const target = subtotal < FREE_SHIPPING_THRESHOLD ? FREE_SHIPPING_THRESHOLD : EXPRESS_SHIPPING_THRESHOLD;
  const remaining = Math.max(0, target - subtotal);
  const progress = Math.min(1, subtotal / EXPRESS_SHIPPING_THRESHOLD);
  const freeMark = (FREE_SHIPPING_THRESHOLD / EXPRESS_SHIPPING_THRESHOLD) * 100;

  const message =
    remaining === 0
      ? "Free express shipping unlocked"
      : target === FREE_SHIPPING_THRESHOLD
        ? `${formatPrice(remaining)} away from free shipping`
        : `Free shipping unlocked · ${formatPrice(remaining)} to free express`;

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm font-medium" aria-live="polite">
        <Truck className="size-4 text-forest" aria-hidden />
        {message}
      </p>
      {/* Width is driven by scaleX so the bar animates on the compositor. */}
      <div className="relative h-2 overflow-hidden rounded-full bg-slate/10" role="progressbar" aria-label="Progress to free express shipping" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <motion.div className="absolute inset-0 origin-left rounded-full bg-forest" initial={false} animate={{ scaleX: progress }} transition={{ type: "spring", stiffness: 110, damping: 20 }} />
        <span className="absolute inset-y-0 w-0.5 bg-bone" style={{ left: `${freeMark}%` }} aria-hidden />
      </div>
      <div className="label-mono relative h-4 text-muted" aria-hidden>
        <span className="absolute -translate-x-1/2" style={{ left: `${freeMark}%` }}>Free · $75</span>
        <span className="absolute right-0">Express · $150</span>
      </div>
    </div>
  );
}
