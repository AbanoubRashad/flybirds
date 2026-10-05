import type { Metadata } from "next";
import Link from "next/link";
import { Photo } from "@/components/ui/photo";
import { PHOTOS, photoBlur, photoSrc } from "@/lib/images";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

// Static demo: Auth.js needs the Node server and Postgres, so this page
// explains that instead of rendering a form that can't submit.
export default function SignInPage() {
  return (
    <div className="container-page py-10 md:py-16">
      <div className="grid overflow-hidden rounded-[28px] bg-sand/60 lg:grid-cols-2">
        <div className="on-dark relative hidden min-h-[640px] lg:block">
          <Photo src={photoSrc("trail", 1400)} alt={PHOTOS.trail.alt} fill sizes="50vw" placeholder="blur" blurDataURL={photoBlur("trail")} className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate/80 via-slate/10 to-transparent" aria-hidden />
          <p className="display absolute bottom-10 left-10 right-10 text-[52px] text-bone">Welcome back to <em className="text-sage">the trail.</em></p>
        </div>

        <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
          <div className="mx-auto w-full max-w-sm">
            <p className="label-mono text-forest">Account</p>
            <h1 className="display mt-4 text-[56px]">Sign in</h1>
            <p className="mt-4 text-muted">
              This is a static preview of Flybirds: the catalog, filters, product pages and cart all run in your browser.
              Accounts use Auth.js with credentials and GitHub sign-in, which need the full Node + PostgreSQL build.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/admin" className="label-mono inline-flex h-12 items-center justify-center rounded-full bg-slate px-6 text-bone transition-colors hover:bg-forest">
                View the ops dashboard
              </Link>
              <a href="https://github.com/AbanoubRashad/flybirds#quick-start" className="label-mono inline-flex h-12 items-center justify-center rounded-full px-6 ring-1 ring-inset ring-line-strong transition-colors hover:bg-slate hover:text-bone">
                Run the full app locally
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
