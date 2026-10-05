"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import type { ProductDetail } from "@/server/queries/products";
import { ProductExperience } from "./product-experience";

/** Static demo: `?color=` is read in the browser; the prerendered HTML shows the first colourway. */
export function DemoProductExperience({ product }: { product: ProductDetail }) {
  return (
    <Suspense fallback={<ProductExperience product={product} />}>
      <WithColor product={product} />
    </Suspense>
  );
}

function WithColor({ product }: { product: ProductDetail }) {
  // Only seeds the initial colourway; later picks update the URL via replaceState without remounting.
  const color = useSearchParams().get("color") ?? undefined;
  return <ProductExperience product={product} initialColor={color} />;
}
