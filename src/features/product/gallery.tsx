"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

const VIEWS = ["Side profile", "Detail", "Close-up", "On the move"];

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [images]); // reset when the colorway changes
  const current = images[idx] ?? images[0];
  const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length);

  return (
    <div className="grid gap-3 lg:grid-cols-[88px_1fr] lg:gap-4">
      <div className="relative order-1 aspect-[4/5] overflow-hidden rounded-[20px] bg-sand sm:aspect-[5/4] lg:order-2 lg:aspect-auto lg:h-[min(760px,calc(100dvh-140px))]">
        <AnimatePresence initial={false}>
          {current && (
            <motion.div key={current} className="absolute inset-0" initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <ProductImage src={current} alt={`${alt} — ${VIEWS[idx] ?? `view ${idx + 1}`}`} fill sizes="(min-width:1024px) 58vw, 100vw" className="object-cover" />
            </motion.div>
          )}
        </AnimatePresence>
        {images.length > 1 && (
          <>
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button type="button" onClick={() => go(-1)} aria-label="Previous image" className="grid size-11 place-items-center rounded-full bg-bone/90 text-slate backdrop-blur transition-colors hover:bg-slate hover:text-bone"><ChevronLeft className="size-5" aria-hidden /></button>
              <button type="button" onClick={() => go(1)} aria-label="Next image" className="grid size-11 place-items-center rounded-full bg-bone/90 text-slate backdrop-blur transition-colors hover:bg-slate hover:text-bone"><ChevronRight className="size-5" aria-hidden /></button>
            </div>
            <p className="label-mono absolute bottom-6 left-5 rounded-full bg-bone/90 px-3 py-1.5 text-slate" aria-live="polite">
              {String(idx + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </p>
          </>
        )}
      </div>

      <div className="order-2 flex gap-2 overflow-x-auto lg:order-1 lg:flex-col lg:overflow-visible" role="group" aria-label="Product images">
        {images.map((src, i) => (
          <button key={src} type="button" onClick={() => setIdx(i)} aria-label={`Show ${VIEWS[i] ?? `image ${i + 1}`}`} aria-pressed={i === idx}
            className={cn("relative aspect-square w-20 shrink-0 overflow-hidden rounded-[14px] bg-sand ring-2 ring-offset-2 ring-offset-bone transition-[box-shadow,opacity] duration-300 lg:w-full", i === idx ? "ring-slate" : "ring-transparent opacity-70 hover:opacity-100")}>
            <ProductImage src={src} alt="" fill sizes="88px" className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
