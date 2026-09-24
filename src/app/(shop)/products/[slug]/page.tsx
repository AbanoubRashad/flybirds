import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { ProductExperience } from "@/features/product/product-experience";
import { getProductBySlug } from "@/server/queries/products";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ color?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return product ? { title: product.name, description: product.tagline } : {};
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, { color }] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description,
    offers: { "@type": "Offer", priceCurrency: "USD", price: (product.basePrice / 100).toFixed(2) },
    ...(product._count.reviews > 0 && { aggregateRating: { "@type": "AggregateRating", ratingValue: product.avgRating.toFixed(1), reviewCount: product._count.reviews } }),
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductExperience product={product} initialColor={color} />

      <section className="mt-24 grid gap-10 md:grid-cols-[1fr_2fr]">
        <div>
          <p className="label-mono text-forest-500">Field notes</p>
          <h2 className="mt-2 text-2xl font-semibold">{product.description}</h2>
        </div>
        <div id="reviews">
          <p className="label-mono">Reviews ({product._count.reviews})</p>
          <ul className="mt-4 divide-y divide-slate-900/10">
            {product.reviews.map((r) => (
              <li key={r.id} className="py-5">
                <div className="flex items-center gap-3">
                  <span className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-3.5 stroke-none ${i < r.rating ? "fill-slate-900" : "fill-slate-900/15"}`} />)}</span>
                  <span className="text-sm font-medium">{r.user.name}</span>
                  {r.verifiedPurchase && <span className="label-mono text-forest-500">Verified buyer</span>}
                </div>
                <p className="mt-2 text-slate-600">{r.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
