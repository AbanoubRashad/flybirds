import { getCatalog, parseCatalogParams } from "@/server/queries/products";
import { Bestsellers } from "./bestsellers";

const PER_TAB = 4;

/**
 * Server half of Bestsellers. One featured-sorted `getCatalog` call over the
 * whole catalog, split by department here — four separate calls would fire
 * ~20 queries at once and exhaust a small serverless connection pool.
 */
export async function BestsellersSection() {
  const { products } = await getCatalog(null, parseCatalogParams({}));
  const pick = (test: (p: (typeof products)[number]) => boolean) => products.filter(test).slice(0, PER_TAB);
  return (
    <Bestsellers
      products={{
        men: pick((p) => p.gender === "MEN"),
        women: pick((p) => p.gender === "WOMEN"),
        gear: pick((p) => p.gender === "UNISEX"),
      }}
    />
  );
}
