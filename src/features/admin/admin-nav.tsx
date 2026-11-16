import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
] as const;

/** Section tabs for the ops pages. `current` is the page being rendered. */
export function AdminNav({ current }: { current: (typeof LINKS)[number]["href"] }) {
  return (
    <nav aria-label="Ops sections" className="flex flex-wrap gap-2">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.href === current ? "page" : undefined}
          className={cn(
            "inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors",
            l.href === current ? "bg-slate text-bone" : "ring-1 ring-inset ring-line-strong hover:bg-slate/5",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
