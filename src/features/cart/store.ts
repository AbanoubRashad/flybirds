"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ReconciledLine } from "@/server/actions/cart";

export interface CartLine {
  variantId: string;
  productSlug: string;
  name: string;
  color: string;
  size: string;
  image: string;
  unitPrice: number; // cents
  quantity: number;
  maxQuantity: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  /** Bumped on every local mutation so the sync hook knows to reconcile. */
  revision: number;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQuantity: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  applyServer: (lines: ReconciledLine[]) => string[];
}

const MAX_PER_LINE = 10;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      revision: 0,
      add: (line, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          const cap = Math.min(line.maxQuantity, MAX_PER_LINE);
          const lines = existing
            ? s.lines.map((l) => (l.variantId === line.variantId ? { ...l, quantity: Math.min(l.quantity + qty, cap) } : l))
            : [{ ...line, quantity: Math.min(qty, cap) }, ...s.lines];
          return { lines, isOpen: true, revision: s.revision + 1 };
        }),
      setQuantity: (variantId, qty) =>
        set((s) => ({
          lines: qty <= 0
            ? s.lines.filter((l) => l.variantId !== variantId)
            : s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(qty, l.maxQuantity, MAX_PER_LINE) } : l)),
          revision: s.revision + 1,
        })),
      remove: (variantId) => set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId), revision: s.revision + 1 })),
      clear: () => set((s) => ({ lines: [], revision: s.revision + 1 })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      /** Merge authoritative server state; returns human-readable notices for anything that changed. */
      applyServer: (server) => {
        const notices: string[] = [];
        const byId = new Map(server.map((r) => [r.variantId, r]));
        const lines = get().lines.flatMap((l) => {
          const r = byId.get(l.variantId);
          if (!r) return [l];
          if (r.removed) { notices.push(`${l.name} (${l.size}) sold out and was removed.`); return []; }
          if (r.quantity < l.quantity) notices.push(`Only ${r.available} left of ${l.name} (${l.size}) — quantity updated.`);
          return [{ ...l, quantity: r.quantity, unitPrice: r.unitPrice, maxQuantity: r.available }];
        });
        set({ lines });
        return notices;
      },
    }),
    {
      name: "flybirds-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

// Derived selectors — kept outside the store so components subscribe narrowly.
export const selectCount = (s: CartState) => s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectSubtotal = (s: CartState) => s.lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
