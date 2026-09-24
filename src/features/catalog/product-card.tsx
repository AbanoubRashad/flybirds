"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProductCard as TProductCard } from "@/server/queries/products";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product, index = 0 }: { product: TProductCard; index?: number }) {
  const colors = useMemo(() => {
    const m = new Map<string, { color: string; hex: string; image: string }>();
    for (const v of product.variants) if (!m.has(v.color)) m.set(v.color, { color: v.color, hex: v.colorHex, image: v.images[0] ?? "" });
    return [...m.values()];
  }, [product.variants]);
  const [active, setActive] = useState(colors[0]);
  const minPrice = Math.min(...product.variants.map((v) => v.priceOverride ?? product.basePrice));

  return (
    <motion.article initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04, duration: 0.4 }} className="group">
      <Link href={`/products/${product.slug}${active ? `?color=${encodeURIComponent(active.color)}` : ""}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-bone-100">
          {active && <Image src={active.image} alt={`${product.name} in ${active.color}`} fill sizes="(min-width:1024px) 33vw, 50vw" className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" unoptimized />}
          <span className="label-mono absolute left-3 top-3 bg-bone-50/90 px-2 py-1">ECO {product.sustainabilityRating}</span>
          {minPrice < product.basePrice && <span className="label-mono absolute right-3 top-3 bg-signal px-2 py-1 text-slate-950">Sale</span>}
        </div>
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <Link href={`/products/${product.slug}`} className="font-medium hover:underline">{product.name}</Link>
          <p className="label-mono mt-1 text-slate-400">{product.category.name}</p>
        </div>
        <p className="tabular-nums">{minPrice < product.basePrice && <s className="mr-2 text-slate-400">{formatPrice(product.basePrice)}</s>}{formatPrice(minPrice)}</p>
      </div>
      <div className="mt-3 flex gap-1.5">
        {colors.map((c) => (
          <button key={c.color} onMouseEnter={() => setActive(c)} onFocus={() => setActive(c)} aria-label={c.color}
            className={`size-4 rounded-full ring-offset-2 ring-offset-bone-50 transition ${active?.color === c.color ? "ring-1 ring-slate-900" : ""}`}
            style={{ backgroundColor: c.hex }} />
        ))}
      </div>
    </motion.article>
  );
}
