"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Star } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { useCart } from "@/features/cart/store";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductDetail } from "@/server/queries/products";
import { Gallery } from "./gallery";

const LOW_STOCK = 3;

export function ProductExperience({ product, initialColor }: { product: ProductDetail; initialColor?: string }) {
  // Index variants once: color → size → variant.
  const { colors, matrix } = useMemo(() => {
    const matrix = new Map<string, Map<string, ProductDetail["variants"][number]>>();
    for (const v of product.variants) {
      if (!matrix.has(v.color)) matrix.set(v.color, new Map());
      matrix.get(v.color)!.set(v.size, v);
    }
    const colors = [...matrix.entries()].map(([name, sizes]) => ({ name, hex: [...sizes.values()][0]!.colorHex, inStock: [...sizes.values()].some((v) => v.stockQuantity > 0) }));
    return { colors, matrix };
  }, [product.variants]);

  const [color, setColor] = useState(() => (initialColor && matrix.has(initialColor) ? initialColor : colors[0]!.name));
  const [size, setSize] = useState<string | null>(null);
  const sizesForColor = matrix.get(color)!;
  const variant = size ? sizesForColor.get(size) : undefined;
  const images = useMemo(() => [...sizesForColor.values()][0]!.images, [sizesForColor]);
  const price = variant?.priceOverride ?? [...sizesForColor.values()][0]!.priceOverride ?? product.basePrice;

  // Shallow URL sync: shareable colorway links without an RSC round-trip.
  const selectColor = useCallback((c: string) => {
    setColor(c);
    const url = new URL(window.location.href);
    url.searchParams.set("color", c);
    window.history.replaceState(null, "", url);
  }, []);

  // Size stays selected across colors only if that size exists and is in stock.
  useEffect(() => {
    if (size && !(sizesForColor.get(size)?.stockQuantity)) setSize(null);
  }, [sizesForColor, size]);

  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState(false);
  const [needSize, setNeedSize] = useState(false);
  const addToCart = () => {
    if (!variant) { setNeedSize(true); buyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    add({ variantId: variant.id, productSlug: product.slug, name: product.name, color: variant.color, size: variant.size, image: variant.images[0] ?? "", unitPrice: price, maxQuantity: variant.stockQuantity });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1600);
  };

  // Sticky ATC appears once the primary buy button scrolls out of view.
  const buyRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    const el = buyRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e!.isIntersecting && e!.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const stockMsg = !variant ? null : variant.stockQuantity === 0 ? "Sold out" : variant.stockQuantity <= LOW_STOCK ? `Only ${variant.stockQuantity} left in size ${variant.size}!` : "In stock · ships in 1–2 days";

  return (
    <>
      <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <Gallery images={images} alt={`${product.name} — ${color}`} />

        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="label-mono text-forest-500">{product.category.parent?.name} / {product.category.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{product.name}</h1>
          <p className="mt-2 text-slate-600">{product.tagline}</p>
          <div className="mt-4 flex items-center gap-4">
            <motion.p key={price} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-xl tabular-nums">
              {price < product.basePrice && <s className="mr-2 text-slate-400">{formatPrice(product.basePrice)}</s>}{formatPrice(price)}
            </motion.p>
            {product._count.reviews > 0 && (
              <a href="#reviews" className="flex items-center gap-1 text-sm text-slate-600">
                <Star className="size-4 fill-slate-900 stroke-none" />{product.avgRating.toFixed(1)} <span className="text-slate-400">({product._count.reviews})</span>
              </a>
            )}
          </div>

          <div className="mt-8">
            <p className="label-mono">Color — <span className="text-slate-400">{color}</span></p>
            <div className="mt-3 flex gap-3" role="radiogroup" aria-label="Color">
              {colors.map((c) => (
                <button key={c.name} role="radio" aria-checked={c.name === color} onClick={() => selectColor(c.name)} title={c.name}
                  className={cn("relative size-9 rounded-full ring-offset-2 ring-offset-bone-50 transition", c.name === color ? "ring-2 ring-slate-900" : "ring-1 ring-slate-900/15 hover:ring-slate-900/50", !c.inStock && "opacity-40")}
                  style={{ backgroundColor: c.hex }}><span className="sr-only">{c.name}</span></button>
              ))}
            </div>
          </div>

          <div className="mt-6" ref={buyRef}>
            <div className="flex justify-between">
              <p className={cn("label-mono transition-colors", needSize && !size && "text-signal")}>{needSize && !size ? "Select a size" : "Size"}</p>
              <p className="label-mono text-slate-400">US sizing</p>
            </div>
            <motion.div className="mt-3 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label="Size" animate={needSize && !size ? { x: [0, -6, 6, -3, 0] } : {}} transition={{ duration: 0.35 }}>
              {[...sizesForColor.values()].map((v) => {
                const out = v.stockQuantity === 0;
                const low = !out && v.stockQuantity <= LOW_STOCK;
                return (
                  <button key={v.size} role="radio" aria-checked={size === v.size} disabled={out} onClick={() => { setSize(v.size); setNeedSize(false); }}
                    className={cn("relative h-11 font-mono text-sm ring-1 ring-inset transition-colors", size === v.size ? "bg-slate-900 text-bone-50 ring-slate-900" : "ring-slate-900/15 hover:ring-slate-900", out && "text-slate-400 line-through decoration-slate-400/60")}>
                    {v.size}
                    {low && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-signal" aria-label="Low stock" />}
                  </button>
                );
              })}
            </motion.div>

            <div className="mt-3 h-5">
              <AnimatePresence mode="wait">
                {stockMsg && (
                  <motion.p key={stockMsg} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={cn("label-mono", variant!.stockQuantity <= LOW_STOCK ? "text-signal" : "text-forest-500")}>{stockMsg}</motion.p>
                )}
              </AnimatePresence>
            </div>

            <Button size="lg" className="mt-4 w-full overflow-hidden" onClick={addToCart} disabled={variant?.stockQuantity === 0}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={justAdded ? "added" : "add"} initial={{ y: 20 }} animate={{ y: 0 }} exit={{ y: -20 }}>
                  {justAdded ? "Added ✓" : `Add to cart — ${formatPrice(price)}`}
                </motion.span>
              </AnimatePresence>
            </Button>
            <p className="label-mono mt-3 text-center text-slate-400">Free returns · 30-day wear test</p>
          </div>

          <div className="mt-10">
            <Accordion
              items={[
                { id: "specs", title: "Product specs", content: (
                  <dl className="grid grid-cols-2 gap-y-2">
                    {Object.entries(product.specs as Record<string, string>).map(([k, v]) => (<Fragment key={k}><dt className="label-mono text-slate-400">{k}</dt><dd>{v}</dd></Fragment>))}
                    <dt className="label-mono text-slate-400">Materials</dt><dd>{product.materials.join(", ")}</dd>
                  </dl>) },
                { id: "eco", title: `Eco-impact score · ${product.sustainabilityRating}/100`, content: (
                  <div className="space-y-3">
                    <div className="h-1.5 bg-slate-900/10"><div className="h-full bg-forest-500" style={{ width: `${product.sustainabilityRating}%` }} /></div>
                    <p><span className="font-mono">{product.carbonKg.toFixed(1)} kg CO₂e</span> lifecycle footprint — measured cradle-to-grave and offset at 110%.</p>
                  </div>) },
                { id: "care", title: "Wash & care", content: <ol className="list-decimal space-y-1 pl-4">{product.careInstructions.map((c) => <li key={c}>{c}</li>)}</ol> },
              ]}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSticky && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-900/10 bg-bone-50/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="size-5 shrink-0 rounded-full" style={{ backgroundColor: sizesForColor.values().next().value?.colorHex }} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{product.name}</p>
                  <p className="label-mono text-slate-400">{color}{size ? ` / ${size}` : " / choose size"}</p>
                </div>
              </div>
              <Button onClick={addToCart} disabled={variant?.stockQuantity === 0}>{size ? `Add — ${formatPrice(price)}` : "Select size"}</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
