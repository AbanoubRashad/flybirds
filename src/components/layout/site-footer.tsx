import Link from "next/link";
import { NewsletterForm } from "@/features/newsletter/newsletter-form";
import { Logo } from "./logo";
import { MATERIALS_HREF, NAV } from "./nav";

const COLUMNS = [
  { title: "Shop", links: NAV.map((n) => ({ label: n.label, href: n.href })) },
  {
    title: "Company",
    links: [
      { label: "Our materials", href: MATERIALS_HREF },
      { label: "Carbon report", href: "/#carbon" },
      { label: "Journal", href: "/#journal" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="on-dark mt-24 bg-slate text-bone md:mt-32">
      <div className="container-page grid gap-14 py-16 md:py-20 lg:grid-cols-[1.3fr_1fr] lg:gap-20">
        <div className="max-w-xl">
          <p className="label-mono text-sage">Newsletter</p>
          <h2 className="display mt-4 text-[clamp(40px,6vw,64px)]">Trail notes, <em>twice a month.</em></h2>
          <p className="mt-4 max-w-md text-bone/75">New colourways, repair guides and the occasional field report. No spam, unsubscribe in one click.</p>
          <div className="mt-8"><NewsletterForm /></div>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:gap-12">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="label-mono text-sage">{col.title}</p>
              <ul className="mt-5 space-y-3 text-[15px]">
                {col.links.map((l) => (
                  <li key={l.label}><Link href={l.href} className="text-bone/85 transition-colors hover:text-bone hover:underline hover:underline-offset-4">{l.label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-bone/10">
        <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo tone="light" />
          <p className="label-mono flex flex-wrap gap-x-4 gap-y-1 text-bone/65">
            <span>© 2026 Flybirds</span>
            <span>Portfolio project · no real orders</span>
            <span>Photography: <a href="https://unsplash.com" className="underline underline-offset-2 hover:text-bone" rel="noreferrer" target="_blank">Unsplash</a></span>
          </p>
        </div>
      </div>
    </footer>
  );
}
