"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { Photo } from "@/components/ui/photo";
import Link from "next/link";
import { useRef } from "react";
import { buttonVariants } from "@/components/ui/button";
import { PHOTOS, photoBlur, photoSrc } from "@/lib/images";
import { EASE, fadeUp, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { CountUp } from "./count-up";

const STATS = [
  { label: "Avg footprint", node: <CountUp to={7.2} decimals={1} suffix=" kg" />, unit: "CO₂e" },
  { label: "Natural inputs", node: <CountUp to={78} suffix="%" />, unit: "by weight" },
  { label: "Wear-tested", node: <CountUp to={1000} suffix="+" />, unit: "km" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "18%"]);

  return (
    <section ref={ref} aria-labelledby="hero-title" className="on-dark relative isolate h-[clamp(640px,calc(100svh-110px),780px)] overflow-hidden bg-slate text-bone">
      <motion.div style={{ y }} className="absolute inset-x-0 -top-[6%] h-[118%] -z-10">
        <motion.div className="absolute inset-0" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: EASE }}>
          <Photo
            src={photoSrc("hero", 2400)}
            alt={PHOTOS.hero.alt}
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL={photoBlur("hero")}
            className="object-cover object-[68%_center]"
          />
        </motion.div>
      </motion.div>
      {/* Legibility: dark from the left where the copy sits, plus a floor for the stat strip. */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate/90 via-slate/55 to-slate/0" aria-hidden />
      {/* On narrow screens the copy spans the bright sky too, so add an even wash. */}
      <div className="absolute inset-0 -z-10 bg-slate/50 md:hidden" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-slate/60 to-transparent" aria-hidden />

      <div className="container-page flex h-full flex-col justify-center pb-44 pt-10 md:pb-28">
        <motion.div variants={stagger(0.25, 0.12)} initial="hidden" animate="show" className="max-w-[760px]">
          <motion.p variants={fadeUp} className="label-mono text-sage">FW26 · Field-tested collection</motion.p>
          <motion.h1 variants={fadeUp} id="hero-title" className="display mt-5 text-[clamp(54px,8.6vw,104px)]">
            Built for the <em className="text-sage">long way round.</em>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-[460px] text-[17px] leading-relaxed text-bone/85">
            Trail-ready shoes and basics made from merino, eucalyptus and sugarcane — with the carbon footprint printed on every box.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
            <Link href="/collections/mens-footwear" className={cn(buttonVariants({ variant: "light", size: "lg" }))}>Shop Men</Link>
            <Link href="/collections/womens-footwear" className={cn(buttonVariants({ variant: "outline-light", size: "lg" }), "hover:bg-forest hover:text-bone hover:ring-forest")}>Shop Women</Link>
          </motion.div>
        </motion.div>
      </div>

      <motion.dl
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 1, ease: EASE }}
        className="absolute inset-x-4 bottom-4 grid grid-cols-3 divide-x divide-bone/15 rounded-[20px] bg-slate/30 ring-1 ring-inset ring-bone/20 backdrop-blur-xl sm:inset-x-auto sm:bottom-8 sm:right-6 lg:right-10"
      >
        {STATS.map((s) => (
          <div key={s.label} className="px-4 py-4 sm:px-7 sm:py-5">
            <dt className="label-mono text-bone/75 max-sm:text-[10px]">{s.label}</dt>
            <dd className="mt-2 flex flex-wrap items-baseline gap-x-1.5">
              <span className="font-serif text-[clamp(26px,4vw,38px)] leading-none">{s.node}</span>
              <span className="text-xs text-bone/75">{s.unit}</span>
            </dd>
          </div>
        ))}
      </motion.dl>
    </section>
  );
}
