"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Photo } from "@/components/ui/photo";
import { useState } from "react";
import { PHOTOS, photoBlur, photoSrc, type PhotoKey } from "@/lib/images";
import { EASE } from "@/lib/motion";
import { PillTabs } from "./pill-tabs";

type Material = "merino" | "eucalyptus" | "sugarcane";

const MATERIALS: Record<Material, { label: string; photo: PhotoKey; kicker: string; copy: string; stats: [string, string][] }> = {
  merino: {
    label: "Merino Wool",
    photo: "wool",
    kicker: "Warm when it's cold, cool when it isn't.",
    copy: "Superfine merino from certified farms regulates temperature, wicks moisture and resists odour — so you can wear it sockless, on day three, without apology.",
    stats: [["17.5 µm", "Superfine fibre"], ["3×", "Faster moisture wicking"], ["100%", "Mulesing-free"]],
  },
  eucalyptus: {
    label: "Eucalyptus",
    photo: "forest",
    kicker: "A silky knit grown on rain alone.",
    copy: "Responsibly forested eucalyptus pulp is spun into a smooth, breathable fibre in a closed-loop process that recycles almost all of its water and solvent.",
    stats: [["95%", "Less water than cotton"], ["99%", "Solvent recovered"], ["FSC", "Certified sourcing"]],
  },
  sugarcane: {
    label: "Sugarcane EVA",
    photo: "running",
    kicker: "Bounce that starts in a field.",
    copy: "Our midsoles swap petroleum foam for sugarcane-based EVA — a crop that pulls carbon from the air as it grows — for a light, springy ride that lasts.",
    stats: [["54%", "Bio-based content"], ["248 g", "Tempo Runner 2 weight"], ["1,000 km", "Wear-tested"]],
  },
};

const TABS = (Object.keys(MATERIALS) as Material[]).map((value) => ({ value, label: MATERIALS[value].label }));

export function MaterialsStory() {
  const [key, setKey] = useState<Material>("merino");
  const m = MATERIALS[key];

  return (
    <section id="materials" aria-labelledby="materials-title" className="container-page scroll-mt-24 pt-24 md:pt-32">
      <div className="on-dark grid grid-cols-1 overflow-hidden rounded-[28px] bg-slate text-bone lg:min-h-[640px] lg:grid-cols-2">
        <div className="relative min-h-[320px] overflow-hidden sm:min-h-[420px]">
          <AnimatePresence initial={false}>
            <motion.div key={m.photo} className="absolute inset-0" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9, ease: EASE }}>
              <Photo src={photoSrc(m.photo, 1400)} alt={PHOTOS[m.photo].alt} fill sizes="(min-width:1024px) 50vw, 100vw" placeholder="blur" blurDataURL={photoBlur(m.photo)} className="object-cover" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex min-w-0 flex-col justify-center gap-8 p-5 sm:p-10 lg:p-14 xl:p-16">
          <div>
            <p className="label-mono text-sage">Materials</p>
            <h2 id="materials-title" className="display mt-4 text-[clamp(40px,5vw,68px)]">Nature did the <em className="text-sage">engineering first.</em></h2>
          </div>
          <PillTabs id="materials" label="Material" tabs={TABS} value={key} onChange={setKey} tone="light" className="self-start" />

          <div id="materials-panel" role="tabpanel" aria-labelledby={`materials-tab-${key}`} className="min-h-[300px] sm:min-h-[250px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={key} initial="hidden" animate="show" exit="exit" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } }, exit: { opacity: 0, transition: { duration: 0.2 } } }}>
                <motion.p variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="font-serif text-[28px] leading-tight">{m.kicker}</motion.p>
                <motion.p variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="mt-3 max-w-lg leading-relaxed text-bone/80">{m.copy}</motion.p>
                <dl className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
                  {m.stats.map(([value, label]) => (
                    <motion.div key={label} variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="flex flex-col-reverse justify-end rounded-[18px] bg-bone/[0.06] p-3 ring-1 ring-inset ring-bone/10 sm:p-5">
                      <dt className="mt-2 text-xs leading-snug text-bone/75 sm:text-sm">{label}</dt>
                      <dd className="font-serif text-[clamp(24px,3vw,36px)] leading-none">{value}</dd>
                    </motion.div>
                  ))}
                </dl>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
