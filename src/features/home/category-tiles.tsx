import { ArrowUpRight } from "lucide-react";
import { Photo } from "@/components/ui/photo";
import Link from "next/link";
import { PHOTOS, photoBlur, photoSrc, type PhotoKey } from "@/lib/images";
import { SectionHeading } from "./section-heading";

const TILES: { title: string; meta: string; href: string; photo: PhotoKey; position: string }[] = [
  { title: "Running Shoes", meta: "Road & trail", href: "/collections/mens-footwear?sub=mens-running", photo: "running", position: "object-[40%_center]" },
  { title: "All-Weather", meta: "Rain, mud, snow", href: "/collections/mens-footwear?sub=mens-all-weather", photo: "trail", position: "object-[70%_center]" },
  { title: "Apparel & Basics", meta: "Merino & organic cotton", href: "/collections/apparel", photo: "apparel", position: "object-center" },
];

export function CategoryTiles() {
  return (
    <section aria-labelledby="categories-title" className="container-page pt-20 md:pt-28">
      <SectionHeading eyebrow="Shop by terrain" title={<>Pick your <em>path.</em></>} id="categories-title" />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {TILES.map((t, i) => (
          <li key={t.title} className={i === 2 ? "sm:col-span-2 lg:col-span-1" : undefined}>
            <Link href={t.href} className="group relative block h-[440px] overflow-hidden rounded-[20px] bg-sand lg:h-[520px]">
              <Photo
                src={photoSrc(t.photo, 1200)}
                alt={PHOTOS[t.photo].alt}
                fill
                sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
                placeholder="blur"
                blurDataURL={photoBlur(t.photo)}
                className={`${t.position} object-cover transition-transform duration-[1400ms] ease-brand group-hover:scale-[1.06]`}
              />
              <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-slate/85 via-slate/35 to-transparent" aria-hidden />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 text-bone lg:p-7">
                <div>
                  <p className="label-mono text-bone/80">{t.meta}</p>
                  <h3 className="display mt-2 text-[clamp(36px,3.4vw,46px)]">{t.title}</h3>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-bone text-slate transition-transform duration-500 ease-brand group-hover:-rotate-45 group-hover:scale-110" aria-hidden>
                  <ArrowUpRight className="size-5 rotate-45" />
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
