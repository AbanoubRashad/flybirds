"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { create } from "zustand";

interface Toast {
  id: number;
  message: string;
}

interface ToastState {
  toasts: Toast[];
  push: (message: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useToasts = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (message) => {
    const id = ++nextId;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message }] }));
    setTimeout(() => get().dismiss(id), 3200);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = (message: string) => useToasts.getState().push(message);

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-4 z-70 flex flex-col items-center gap-2 px-4 sm:bottom-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate py-2.5 pl-2.5 pr-5 text-sm text-bone shadow-[0_18px_40px_-16px_rgba(28,34,38,.6)]"
          >
            <span className="grid size-7 place-items-center rounded-full bg-sage text-slate"><Check className="size-4" aria-hidden /></span>
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
