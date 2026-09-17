"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Leaf, RotateCcw, Star, Truck } from "lucide-react";
import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Accordion } from "@/components/ui/accordion";
import { useCart } from "@/features/cart/store";
import { compareSizes } from "@/lib/sizes";
import { cn, formatPrice } from "@/lib/utils";
import type { ProductDetail } from "@/server/queries/products";
import { Gallery } from "./gallery";

const LOW_STOCK = 3;

export function ProductExperience({ product, initialColor }: { product: ProductDetail; initialColor?: string }) {
  // Index variants once: color → size → variant (sizes in wearing order).
  const { colors, matrix } = useMemo(() => {
    const matrix = new Map<string, Map<string, ProductDetail["variants"][number]>>();
    const sorted = [...product.variants].sort((a, b) => compareSizes(a.size, b.size));
    for (const v of sorted) {
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
  const hex = colors.find((c) => c.name === color)?.hex;

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

  const stock = !variant ? null
    : variant.stockQuantity === 0 ? { text: "Sold out in this size", low: true }
    : variant.stockQuantity <= LOW_STOCK ? { text: `Only ${variant.stockQuantity} left in size ${variant.size}`, low: true }
    : { text: "In stock · ships in 1–2 days", low: false };

  const hasLowStock = [...sizesForColor.values()].some((v) => v.stockQuantity > 0 && v.stockQuantity <= LOW_STOCK);

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14 xl:gap-20">
        <Gallery images={images} alt={`${product.name} in ${color}`} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Breadcrumb" className="label-mono flex flex-wrap gap-2 text-muted">
            {product.category.parent && <Link href={`/collections/${product.category.parent.slug}`} className="hover:text-slate">{product.category.parent.name}</Link>}
            <span aria-hidden>/</span>
            <span>{product.category.name}</span>
          </nav>
          <h1 className="display mt-4 text-[clamp(44px,5vw,68px)]">{product.name}</h1>
          <p className="mt-3 text-[17px] text-muted">{product.tagline}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
            <p className="text-2xl tabular-nums">
              {price < product.basePrice && <s className="mr-2 text-lg text-muted">{formatPrice(product.basePrice)}</s>}
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={price} className="inline-block font-semibold" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>{formatPrice(price)}</motion.span>
              </AnimatePresence>
            </p>
            {product._count.reviews > 0 && (
              <a href="#reviews" className="flex items-center gap-1.5 text-sm text-muted hover:text-slate">
                <Star className="size-4 fill-slate stroke-none" aria-hidden />
                <span className="font-semibold text-slate">{product.avgRating.toFixed(1)}</span>
                <span>({product._count.reviews} reviews)</span>
              </a>
            )}
            <span className="label-mono inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1.5 text-forest">
              <Leaf className="size-3.5" aria-hidden />{product.carbonKg.toFixed(1)} kg CO₂e
            </span>
          </div>

          <div className="mt-8 rounded-[20px] bg-sand/60 p-5 sm:p-6">
            <p className="label-mono">Colour — <span className="text-muted">{color}</span></p>
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Colour">
              {colors.map((c) => (
                <button key={c.name} type="button" role="radio" aria-checked={c.name === color} onClick={() => selectColor(c.name)} title={c.name}
                  className={cn("grid size-11 place-items-center rounded-full ring-2 transition-[box-shadow] duration-300", c.name === color ? "ring-slate" : "ring-transparent hover:ring-line-strong", !c.inStock && "opacity-40")}>
                  <span className="size-8 rounded-full ring-1 ring-inset ring-slate/15" style={{ backgroundColor: c.hex }} aria-hidden />
                  <span className="sr-only">{c.name}{!c.inStock && " (sold out)"}</span>
                </button>
              ))}
            </div>

            <div className="mt-6" ref={buyRef}>
              <div className="flex items-baseline justify-between">
                <p className={cn("label-mono transition-colors", needSize && !size ? "text-slate underline decoration-ember decoration-2 underline-offset-4" : "")} aria-live="polite">
                  {needSize && !size ? "Select a size to continue" : "Size"}
                </p>
                <p className="label-mono text-muted">US sizing · true to size</p>
              </div>
              <motion.div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5" role="radiogroup" aria-label="Size" animate={needSize && !size ? { x: [0, -6, 6, -3, 0] } : { x: 0 }} transition={{ duration: 0.35 }}>
                {[...sizesForColor.values()].map((v) => {
                  const out = v.stockQuantity === 0;
                  const low = !out && v.stockQuantity <= LOW_STOCK;
                  const selected = size === v.size;
                  return (
                    <button key={v.size} type="button" role="radio" aria-checked={selected} disabled={out} onClick={() => { setSize(v.size); setNeedSize(false); }}
                      className={cn("relative h-12 rounded-full font-mono text-sm ring-1 ring-inset transition-colors duration-300",
                        selected ? "bg-slate text-bone ring-slate" : "bg-bone ring-line-strong hover:ring-slate",
                        out && "cursor-not-allowed bg-transparent text-muted line-through decoration-muted/60")}>
                      {v.size}
                      {low && <span className="absolute right-2.5 top-2 size-1.5 rounded-full bg-ember" aria-hidden />}
                      <span className="sr-only">{out ? " — sold out" : low ? ` — only ${v.stockQuantity} left` : ""}</span>
                    </button>
                  );
                })}
              </motion.div>
              {hasLowStock && <p className="label-mono mt-3 flex items-center gap-2 text-muted"><span className="size-1.5 rounded-full bg-ember" aria-hidden />Low stock</p>}

              <div className="mt-3 h-5">
                <AnimatePresence mode="wait">
                  {stock && (
                    <motion.p key={stock.text} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2 text-sm font-medium">
                      <span className={cn("size-2 rounded-full", stock.low ? "bg-ember" : "bg-forest")} aria-hidden />
                      {stock.text}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <Button size="lg" variant="forest" className="mt-4 w-full overflow-hidden" onClick={addToCart} disabled={variant?.stockQuantity === 0}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={justAdded ? "added" : "add"} className="flex items-center gap-2" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.25 }}>
                    {justAdded ? <><Check className="size-4" aria-hidden />Added to cart</> : `Add to cart — ${formatPrice(price)}`}
                  </motion.span>
                </AnimatePresence>
              </Button>
            </div>
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2.5 rounded-full px-4 py-3 ring-1 ring-inset ring-line"><Truck className="size-4 text-forest" aria-hidden />Free shipping over $75</li>
            <li className="flex items-center gap-2.5 rounded-full px-4 py-3 ring-1 ring-inset ring-line"><RotateCcw className="size-4 text-forest" aria-hidden />30-day wear test</li>
          </ul>

          <div className="mt-8">
            <Accordion
              defaultValue={["specs"]}
              items={[
                { id: "specs", title: "Specs", content: (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
                    {Object.entries(product.specs as Record<string, string>).map(([k, v]) => (<Fragment key={k}><dt className="label-mono pt-0.5 text-muted">{k}</dt><dd className="text-slate">{v}</dd></Fragment>))}
                    <dt className="label-mono pt-0.5 text-muted">Materials</dt><dd className="text-slate">{product.materials.join(", ")}</dd>
                  </dl>) },
                { id: "eco", title: <span className="flex items-center gap-3">Eco-impact <span className="label-mono rounded-full bg-sand px-2.5 py-1 text-forest">{product.sustainabilityRating}/100</span></span>, content: (
                  <div className="space-y-4">
                    <div className="h-2 overflow-hidden rounded-full bg-slate/10" role="img" aria-label={`Eco-impact score ${product.sustainabilityRating} out of 100`}>
                      <div className="h-full origin-left rounded-full bg-forest" style={{ transform: `scaleX(${product.sustainabilityRating / 100})` }} />
                    </div>
                    <p><span className="font-semibold text-slate">{product.carbonKg.toFixed(1)} kg CO₂e</span> lifecycle footprint — measured cradle-to-grave and offset at 110%.</p>
                  </div>) },
                { id: "care", title: "Care", content: <ol className="list-decimal space-y-1.5 pl-5 marker:font-mono marker:text-muted">{product.careInstructions.map((c) => <li key={c}>{c}</li>)}</ol> },
              ]}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSticky && (
          <motion.div initial={{ y: "140%" }} animate={{ y: 0 }} exit={{ y: "140%" }} transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed inset-x-3 bottom-3 z-30 mx-auto max-w-3xl rounded-full bg-slate/95 p-2 text-bone shadow-[0_20px_50px_-20px_rgba(28,34,38,.7)] backdrop-blur-md sm:inset-x-6 sm:bottom-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3 pl-2">
                <span className="size-8 shrink-0 rounded-full ring-2 ring-bone/20" style={{ backgroundColor: hex }} aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{product.name}</p>
                  <p className="label-mono truncate text-bone/70">{color}{size ? ` · Size ${size}` : " · choose size"}</p>
                </div>
              </div>
              <Button onClick={addToCart} variant="light" disabled={variant?.stockQuantity === 0} className="h-12 shrink-0 px-5 sm:px-7">
                {size ? `Add — ${formatPrice(price)}` : "Select size"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
