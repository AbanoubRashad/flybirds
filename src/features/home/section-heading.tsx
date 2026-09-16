import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({ eyebrow, title, id, className, tone = "dark", children }: { eyebrow: string; title: ReactNode; id?: string; className?: string; tone?: "dark" | "light"; children?: ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div>
        <p className={cn("label-mono", tone === "dark" ? "text-forest" : "text-sage")}>{eyebrow}</p>
        <h2 id={id} className="display mt-4 text-[clamp(40px,5.4vw,68px)]">{title}</h2>
      </div>
      {children}
    </div>
  );
}
