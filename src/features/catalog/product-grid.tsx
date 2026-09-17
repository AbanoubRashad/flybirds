import Link from "next/link";
import type { ProductCard as TProductCard } from "@/server/queries/products";
import { ProductCard } from "./product-card";

interface Empty {
  message: string;
  href: string;
  cta: string;
}

const DEFAULT_EMPTY: Empty = { message: "No products match these filters — try loosening a few.", href: "", cta: "Reset filters" };

export function ProductGrid({ products, className = "xl:grid-cols-3", empty }: { products: TProductCard[]; className?: string; empty?: Partial<Empty> }) {
  if (products.length === 0) {
    const e = { ...DEFAULT_EMPTY, ...empty };
    return (
      <div className="rounded-[20px] bg-sand/60 px-6 py-20 text-center">
        <p className="display text-[36px]">Nothing on this trail.</p>
        <p className="mt-2 text-muted">{e.message}</p>
        {e.href && <Link href={e.href} className="label-mono mt-6 inline-block underline underline-offset-4 hover:text-forest">{e.cta}</Link>}
      </div>
    );
  }
  return (
    <ul className={`grid content-start gap-x-5 gap-y-12 min-[480px]:grid-cols-2 ${className}`}>
      {products.map((p, i) => <li key={p.id}><ProductCard product={p} index={i} /></li>)}
    </ul>
  );
}
