import Link from "next/link";
import { CartButton } from "@/features/cart/cart-drawer";
import { Logo } from "./logo";
import { MobileMenu } from "./mobile-menu";
import { MATERIALS_HREF, NAV } from "./nav";
import { SearchButton } from "./search-dialog";

const underline =
  "relative py-2 after:absolute after:inset-x-0 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-500 after:ease-brand hover:after:scale-x-100 focus-visible:after:scale-x-100";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bone/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="container-page grid h-[76px] grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center">
          <MobileMenu />
          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-7 text-[14px] font-medium">
              {NAV.map((n) => (
                <li key={n.href}><Link href={n.href} className={underline}>{n.label}</Link></li>
              ))}
            </ul>
          </nav>
        </div>

        <Logo />

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <Link href={MATERIALS_HREF} className={`${underline} mr-3 hidden text-[14px] font-medium xl:block`}>Our materials</Link>
          <SearchButton />
          <CartButton />
        </div>
      </div>
    </header>
  );
}
