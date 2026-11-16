"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCart } from "@/features/cart/store";

/** Empties the cart once, after the order is confirmed paid. */
export function ClearCartOnPaid() {
  const clear = useCart((s) => s.clear);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
}

/**
 * The customer can land on the confirmation page a moment before the webhook
 * does. While the order is still PENDING, re-check every 2 seconds (for up to a minute).
 */
export function RefreshWhilePending() {
  const router = useRouter();
  useEffect(() => {
    let tries = 0;
    const id = window.setInterval(() => {
      if (++tries > 30) return window.clearInterval(id);
      router.refresh();
    }, 2000);
    return () => window.clearInterval(id);
  }, [router]);
  return null;
}
