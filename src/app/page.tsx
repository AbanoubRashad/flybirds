import { BestsellersSection } from "@/features/home/bestsellers-section";
import { CarbonBand } from "@/features/home/carbon-band";
import { CategoryTiles } from "@/features/home/category-tiles";
import { Hero } from "@/features/home/hero";
import { Journal } from "@/features/home/journal";
import { MaterialsStory } from "@/features/home/materials-story";

// Static shell with Bestsellers refreshed from the catalog every 5 minutes.
export const revalidate = 300;

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
