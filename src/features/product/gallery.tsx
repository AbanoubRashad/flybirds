"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => setIdx(0), [images]); // reset when the colorway changes
  const current = images[idx] ?? images[0];

  return (
    <div className="grid gap-3 md:grid-cols-[72px_1fr]">
      <div className="order-2 flex gap-2 md:order-1 md:flex-col">
        {images.map((src, i) => (
          <button key={src} onClick={() => setIdx(i)} aria-label={`View image ${i + 1}`}
            className={cn("relative aspect-square w-16 overflow-hidden bg-bone-100 ring-1 transition md:w-full", i === idx ? "ring-slate-900" : "ring-transparent opacity-70 hover:opacity-100")}>
            <Image src={src} alt="" fill sizes="72px" className="object-cover" unoptimized />
          </button>
        ))}
      </div>
      <div className="relative order-1 aspect-[4/3] overflow-hidden bg-bone-100 md:order-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {current && (
            <motion.div key={current} className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
              <Image src={current} alt={alt} fill priority sizes="(min-width:1024px) 60vw, 100vw" className="object-cover" unoptimized />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
