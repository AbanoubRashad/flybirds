import { BestsellersSection } from "@/features/home/bestsellers-section";
import { CarbonBand } from "@/features/home/carbon-band";
import { CategoryTiles } from "@/features/home/category-tiles";
import { Hero } from "@/features/home/hero";
import { Journal } from "@/features/home/journal";
import { MaterialsStory } from "@/features/home/materials-story";

// Static demo: fully prerendered at build time (no ISR in a static export).

export default function Home() {
  return (
    <>
      <Hero />
      <CategoryTiles />
      <BestsellersSection />
      <MaterialsStory />
      <CarbonBand />
      <Journal />
    </>
  );
}
