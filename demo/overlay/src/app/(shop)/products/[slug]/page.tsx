import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, Star } from "lucide-react";
import { DemoProductExperience } from "@/features/product/demo-product";
import { getProductBySlug, productSlugs } from "@/server/queries/products";

// Static demo: every product is prerendered; `?color=` is applied in the browser.
export const dynamicParams = false;
export const generateStaticParams = () => productSlugs().map((slug) => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  return product ? { title: product.name, description: product.tagline } : {};
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description,
    offers: { "@type": "Offer", priceCurrency: "USD", price: (product.basePrice / 100).toFixed(2) },
    ...(product._count.reviews > 0 && { aggregateRating: { "@type": "AggregateRating", ratingValue: product.avgRating.toFixed(1), reviewCount: product._count.reviews } }),
  };

  return (
    <div className="container-page pt-6 md:pt-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DemoProductExperience product={product} />

      <section className="mt-24 grid gap-12 border-t border-line pt-16 md:mt-32 lg:grid-cols-[1fr_1.4fr] lg:gap-20" aria-labelledby="field-notes">
        <div>
          <p className="label-mono text-forest">Field notes</p>
          <h2 id="field-notes" className="display mt-4 text-[clamp(32px,3.6vw,48px)] leading-[1.05]">{product.description}</h2>
        </div>
        <div id="reviews" className="scroll-mt-24">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="label-mono">Reviews ({product._count.reviews})</h2>
            {product._count.reviews > 0 && (
              <p className="flex items-baseline gap-2"><span className="font-serif text-[44px] leading-none">{product.avgRating.toFixed(1)}</span><span className="text-sm text-muted">out of 5</span></p>
            )}
          </div>
          {product.reviews.length === 0 && <p className="mt-6 text-muted">No reviews yet — be the first after your wear test.</p>}
          <ul className="mt-4 space-y-3">
            {product.reviews.map((r) => (
              <li key={r.id} className="rounded-[20px] bg-sand/60 p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex" role="img" aria-label={`${r.rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => <Star key={i} className={`size-4 stroke-none ${i < r.rating ? "fill-slate" : "fill-slate/15"}`} aria-hidden />)}
                  </span>
                  <span className="text-sm font-semibold">{r.user.name}</span>
                  {r.verifiedPurchase && <span className="label-mono inline-flex items-center gap-1 text-forest"><BadgeCheck className="size-3.5" aria-hidden />Verified buyer</span>}
                </div>
                <p className="mt-3 text-muted">{r.comment}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
