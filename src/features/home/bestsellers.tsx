"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductCard } from "@/features/catalog/product-card";
import type { ProductCard as TProductCard } from "@/server/queries/products";
import { PillTabs } from "./pill-tabs";
import { SectionHeading } from "./section-heading";

export type BestsellerTab = "men" | "women" | "gear";

const TABS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "gear", label: "Apparel & Gear" },
] as const satisfies readonly { value: BestsellerTab; label: string }[];

const SHOP_ALL: Record<BestsellerTab, string> = {
  men: "/collections/mens-footwear",
  women: "/collections/womens-footwear",
  gear: "/collections/apparel",
};

export function Bestsellers({ products }: { products: Record<BestsellerTab, TProductCard[]> }) {
  const [tab, setTab] = useState<BestsellerTab>("men");

  return (
    <section aria-labelledby="bestsellers-title" className="container-page pt-24 md:pt-32">
      <SectionHeading eyebrow="Bestsellers" title={<>Most-worn <em>this season</em></>} id="bestsellers-title">
        <PillTabs id="bestsellers" label="Bestseller category" tabs={TABS} value={tab} onChange={setTab} />
      </SectionHeading>

      <div id="bestsellers-panel" role="tabpanel" aria-labelledby={`bestsellers-tab-${tab}`} className="mt-10">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={tab}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.45 }}
            className="grid gap-x-5 gap-y-12 min-[480px]:grid-cols-2 lg:grid-cols-4"
          >
            {products[tab].map((p, i) => <li key={p.id}><ProductCard product={p} index={i} /></li>)}
            {products[tab].length === 0 && <li className="label-mono col-span-full py-16 text-center text-muted">New arrivals are on their way.</li>}
          </motion.ul>
        </AnimatePresence>
        <div className="mt-12 flex justify-center">
          <Link href={SHOP_ALL[tab]} className="group label-mono inline-flex items-center gap-2 rounded-full px-5 py-3 ring-1 ring-inset ring-line-strong transition-colors hover:bg-slate hover:text-bone">
            Shop all {TABS.find((t) => t.value === tab)?.label}
            <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
