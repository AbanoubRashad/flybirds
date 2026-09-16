"use client";

import { motion } from "framer-motion";
import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

/**
 * Segmented pill control implementing the WAI-ARIA tabs pattern
 * (roving tabindex, arrow/Home/End keys). The active pill slides via layoutId.
 */
export function PillTabs<T extends string>({
  id, label, tabs, value, onChange, tone = "dark", className,
}: {
  id: string;
  label: string;
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  tone?: "dark" | "light";
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    const last = tabs.length - 1;
    const next = e.key === "ArrowRight" ? (i === last ? 0 : i + 1) : e.key === "ArrowLeft" ? (i === 0 ? last : i - 1) : e.key === "Home" ? 0 : e.key === "End" ? last : null;
    if (next === null) return;
    e.preventDefault();
    const tab = tabs[next];
    if (!tab) return;
    onChange(tab.value);
    refs.current[next]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={cn("inline-flex max-w-full gap-1 overflow-x-auto rounded-full p-1", tone === "dark" ? "bg-sand" : "bg-bone/10 ring-1 ring-inset ring-bone/15", className)}>
      {tabs.map((t, i) => {
        const selected = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${id}-tab-${t.value}`}
            aria-selected={selected}
            aria-controls={`${id}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              "relative h-10 shrink-0 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition-colors duration-300 sm:px-5 sm:text-sm",
              tone === "dark" ? (selected ? "text-bone" : "text-slate/75 hover:text-slate") : selected ? "text-slate" : "text-bone/80 hover:text-bone",
            )}
          >
            {selected && (
              <motion.span layoutId={`${id}-pill`} className={cn("absolute inset-0 rounded-full", tone === "dark" ? "bg-slate" : "bg-bone")} transition={{ type: "spring", stiffness: 420, damping: 36 }} aria-hidden />
            )}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
