import { Photo } from "@/components/ui/photo";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { PHOTOS, photoBlur, photoSrc } from "@/lib/images";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="container-page pt-6 md:pt-10">
      <section className="on-dark relative isolate flex min-h-[560px] items-center overflow-hidden rounded-[28px] bg-slate text-bone md:min-h-[640px]">
        <Photo src={photoSrc("forest", 2000)} alt={PHOTOS.forest.alt} fill sizes="100vw" placeholder="blur" blurDataURL={photoBlur("forest")} className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate/85 via-slate/60 to-slate/30" aria-hidden />
        <div className="px-6 py-16 sm:px-12 lg:px-16">
          <p className="label-mono text-sage">404 · Off-trail</p>
          <h1 className="display mt-5 max-w-3xl text-[clamp(52px,8vw,104px)]">This path <em className="text-sage">doesn&apos;t go anywhere.</em></h1>
          <p className="mt-6 max-w-md text-lg text-bone/85">The page you&apos;re looking for has moved, or never existed. Let&apos;s get you back to marked trails.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/" className={cn(buttonVariants({ variant: "light", size: "lg" }))}>Back to base camp</Link>
            <Link href="/collections/mens-footwear" className={cn(buttonVariants({ variant: "outline-light", size: "lg" }))}>Shop footwear</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
