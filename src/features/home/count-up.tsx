"use client";

import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";
import { EASE } from "@/lib/motion";

interface Format {
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

const format = (n: number, { decimals = 0, prefix = "", suffix = "" }: Format) =>
  `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`;

/**
 * Counts from 0 to `to` the first time it scrolls into view. The server
 * renders the final value (no-JS and crawlers see real numbers) and screen
 * readers always get the final value; the ticking digits are aria-hidden.
 * Digits are written straight to the DOM so React doesn't re-render per frame.
 */
export function CountUp({ to, decimals, prefix, suffix, duration = 1.8, className }: { to: number; duration?: number; className?: string } & Format) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const opts = useRef<Format>({ decimals, prefix, suffix });
  opts.current = { decimals, prefix, suffix };

  useEffect(() => {
    if (!reduce && ref.current) ref.current.textContent = format(0, opts.current);
  }, [reduce]);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, to, {
      duration,
      ease: EASE,
      onUpdate: (v) => { if (ref.current) ref.current.textContent = format(v, opts.current); },
    });
    return () => controls.stop();
  }, [inView, reduce, to, duration]);

  const final = format(to, { decimals, prefix, suffix });
  return (
    <span className={className}>
      <span ref={ref} aria-hidden className="tabular-nums">{final}</span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
