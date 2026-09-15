import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <Link href="/" aria-label="Flybirds home" className={cn("group inline-flex items-center gap-2", className)}>
      <svg viewBox="0 0 24 24" className={cn("size-5 transition-transform duration-500 ease-brand group-hover:-translate-y-0.5", tone === "dark" ? "fill-forest" : "fill-sage")} aria-hidden>
        <path d="M2 15 L12 6.5 L22 15 L17.2 15 L12 10.6 L6.8 15 Z" />
      </svg>
      <span className={cn("font-serif text-[30px] leading-none tracking-[-0.02em]", tone === "dark" ? "text-slate" : "text-bone")}>flybirds</span>
    </Link>
  );
}
