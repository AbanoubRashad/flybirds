"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { toast } from "@/components/ui/toast";
import { useCart } from "@/features/cart/store";
import { compareSizes } from "@/lib/sizes";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductCard as TProductCard } from "@/server/queries/products";

type Variant = TProductCard["variants"][number];

interface Colorway {
  color: string;
  hex: string;
  image: string;
  price: number;
  /** Size offered by quick add: the in-stock size closest to the middle of the run. */
  quick: Variant | null;
}

function badgeFor(product: TProductCard, onSale: boolean, index: number) {
  if (onSale) return { label: "Sale", className: "bg-ember text-slate" };
  if (index === 0) return { label: "Bestseller", className: "bg-slate text-bone" };
  if (product.sustainabilityRating >= 85) return { label: `Eco ${product.sustainabilityRating}`, className: "bg-bone text-forest" };
  return null;
}

export function ProductCard({ product, index = 0 }: { product: TProductCard; index?: number }) {
  const colorways = useMemo<Colorway[]>(() => {
    const byColor = new Map<string, Variant[]>();
    for (const v of product.variants) byColor.set(v.color, [...(byColor.get(v.color) ?? []), v]);
    return [...byColor.entries()].map(([color, vs]) => {
      const sorted = [...vs].sort((a, b) => compareSizes(a.size, b.size));
      const mid = Math.floor(sorted.length / 2);
      const inStock = sorted.filter((v) => v.stockQuantity > 0);
      const quick = inStock.sort((a, b) => Math.abs(sorted.indexOf(a) - mid) - Math.abs(sorted.indexOf(b) - mid))[0] ?? null;
      const first = sorted[0]!;
      return { color, hex: first.colorHex, image: first.images[0] ?? "", price: first.priceOverride ?? product.basePrice, quick };
    });
  }, [product.variants, product.basePrice]);

  const [activeColor, setActiveColor] = useState(colorways[0]?.color);
  const active = colorways.find((c) => c.color === activeColor) ?? colorways[0];
  const add = useCart((s) => s.add);

  if (!active) return null;
  const onSale = active.price < product.basePrice;
  const badge = badgeFor(product, onSale, index);
  const href = `/products/${product.slug}?color=${encodeURIComponent(active.color)}`;

  const quickAdd = () => {
    const v = active.quick;
    if (!v) return;
    add(
      { variantId: v.id, productSlug: product.slug, name: product.name, color: v.color, size: v.size, image: v.images[0] ?? active.image, unitPrice: v.priceOverride ?? product.basePrice, maxQuantity: v.stockQuantity },
      1,
      { open: false },
    );
    toast(`Added ${product.name} — ${v.color}`);
  };

  return (
    <article className="group/card">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-sand lg:aspect-auto lg:h-[380px]">
        <Link href={href} className="absolute inset-0" aria-label={`${product.name} in ${active.color}`}>
          <AnimatePresence initial={false}>
            <motion.div key={active.image} className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
              <ProductImage
                src={active.image}
                alt={`${product.name} in ${active.color}`}
                fill
                sizes="(min-width:1280px) 25vw, (min-width:1024px) 30vw, (min-width:480px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1200ms] ease-brand group-hover/card:scale-[1.04]"
              />
            </motion.div>
          </AnimatePresence>
        </Link>

        {badge && <span className={cn("label-mono pointer-events-none absolute left-3 top-3 rounded-full px-3 py-1.5", badge.className)}>{badge.label}</span>}

        {active.quick ? (
          <button
            type="button"
            onClick={quickAdd}
            className="absolute inset-x-3 bottom-3 flex h-11 translate-y-3 items-center justify-center gap-2 rounded-full bg-bone/95 text-sm font-semibold text-slate opacity-0 shadow-[0_10px_30px_-12px_rgba(28,34,38,.5)] backdrop-blur transition-[transform,opacity,background-color,color] duration-500 ease-brand hover:bg-slate hover:text-bone focus-visible:translate-y-0 focus-visible:opacity-100 group-hover/card:translate-y-0 group-hover/card:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100"
          >
            <Plus className="size-4" aria-hidden />
            Quick add — size {active.quick.size}
            <span className="sr-only">, {product.name} in {active.color}</span>
          </button>
        ) : (
          <span className="label-mono absolute inset-x-3 bottom-3 grid h-11 place-items-center rounded-full bg-bone/90 text-muted">Sold out in {active.color}</span>
        )}
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">
            <Link href={href} className="hover:underline hover:underline-offset-4">{product.name}</Link>
          </h3>
          <p className="mt-0.5 text-sm text-muted">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={active.color} className="inline-block" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>{active.color}</motion.span>
            </AnimatePresence>
            <span aria-hidden> · </span>{product.category.name}
          </p>
        </div>
        <p className="shrink-0 text-right tabular-nums">
          {onSale && <s className="mr-1.5 text-sm text-muted">{formatPrice(product.basePrice)}</s>}
          <span className="font-semibold">{formatPrice(active.price)}</span>
        </p>
      </div>

      {colorways.length > 1 && (
        <div className="mt-3 flex gap-1" role="group" aria-label={`${product.name} colours`}>
          {colorways.map((c) => (
            <button
              key={c.color}
              type="button"
              onMouseEnter={() => setActiveColor(c.color)}
              onFocus={() => setActiveColor(c.color)}
              onClick={() => setActiveColor(c.color)}
              aria-label={`Show ${c.color}`}
              aria-pressed={c.color === active.color}
              className="grid size-8 place-items-center rounded-full"
            >
              <span
                className={cn("size-5 rounded-full ring-1 ring-inset ring-slate/15 outline-offset-2 transition-[outline-color] duration-300", c.color === active.color ? "outline-[1.5px] outline-slate outline" : "outline-[1.5px] outline-transparent outline")}
                style={{ backgroundColor: c.hex }}
              />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
