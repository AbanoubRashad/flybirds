import { ArrowUpRight } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import Link from "next/link";
import { PHOTOS, photoBlur, photoSrc, type PhotoKey } from "@/lib/images";
import { SectionHeading } from "./section-heading";

const STORIES: { title: string; meta: string; excerpt: string; href: string; photo: PhotoKey }[] = [
  { title: "Ten thousand steps, one pair", meta: "City · 5 min read", excerpt: "A week of commutes, cobbles and late trains in the Canopy Knit Low.", href: "/collections/mens-footwear?sub=mens-everyday", photo: "city" },
  { title: "The art of packing light", meta: "Travel · 7 min read", excerpt: "How we fit a week into a 40L carry-on — shoe bay included.", href: "/collections/accessories?sub=travel-bags", photo: "bag" },
  { title: "Why merino does the thinking", meta: "Materials · 4 min read", excerpt: "The fibre that warms, cools and shrugs off odour, explained.", href: "/collections/apparel?sub=merino-tees", photo: "wool" },
];

export function Journal() {
  return (
    <section id="journal" aria-labelledby="journal-title" className="container-page scroll-mt-24 pt-24 md:pt-32">
      <SectionHeading eyebrow="Journal" title={<>Made for <em>every mile</em></>} id="journal-title" />
      <ul className="mt-10 grid gap-x-6 gap-y-12 md:grid-cols-3">
        {STORIES.map((s) => (
          <li key={s.title}>
            <Link href={s.href} className="group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] bg-sand">
                <Photo src={photoSrc(s.photo, 1000)} alt={PHOTOS[s.photo].alt} fill sizes="(min-width:768px) 33vw, 100vw" placeholder="blur" blurDataURL={photoBlur(s.photo)} className="object-cover transition-transform duration-[1400ms] ease-brand group-hover:scale-[1.06]" />
              </div>
              <p className="label-mono mt-5 text-muted">{s.meta}</p>
              <h3 className="mt-2 flex items-start justify-between gap-4 font-serif text-[30px] leading-[1.05]">
                {s.title}
                <ArrowUpRight className="mt-1 size-5 shrink-0 transition-transform duration-500 ease-brand group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
              </h3>
              <p className="mt-2 text-muted">{s.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
