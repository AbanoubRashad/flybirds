"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import Link from "next/link";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { PHOTOS, photoBlur, photoSrc } from "@/lib/images";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";

export function CarbonBand() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-12%", "12%"]);

  return (
    <section id="carbon" ref={ref} aria-labelledby="carbon-title" className="on-dark relative isolate mt-24 scroll-mt-20 overflow-hidden bg-slate text-bone md:mt-32">
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[14%] -z-10 h-[128%]">
        <Photo src={photoSrc("forest", 2400)} alt={PHOTOS.forest.alt} fill sizes="100vw" placeholder="blur" blurDataURL={photoBlur("forest")} className="object-cover" />
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-slate/55" aria-hidden />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-slate/80 via-transparent to-slate/40" aria-hidden />

      <div className="container-page flex min-h-[620px] flex-col items-center justify-center py-24 text-center md:min-h-[720px]">
        <p className="label-mono text-sage">Carbon, counted</p>
        <h2 id="carbon-title" className="sr-only">Average footprint: 7.2 kg CO₂e per pair</h2>
        <p className="display mt-6 text-[clamp(104px,22vw,300px)] leading-[0.85]" aria-hidden>
          <CountUp to={7.2} decimals={1} duration={2.2} /><span className="text-[0.42em] tracking-normal"> kg</span>
        </p>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-bone/85">
          CO₂e is the average footprint of a pair of Flybirds — measured cradle to grave, printed on every box, and cut a little further every season.
        </p>
        <Link href="/collections/mens-footwear?sort=eco" className={cn(buttonVariants({ variant: "light", size: "lg" }), "group mt-10")}>
          Read the carbon report <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
