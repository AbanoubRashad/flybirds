import Link from "next/link";
import { CartButton } from "@/features/cart/cart-drawer";

const NAV = [
  ["Men", "/collections/mens-footwear"],
  ["Women", "/collections/womens-footwear"],
  ["Apparel", "/collections/apparel"],
  ["Gear & Care", "/collections/accessories"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-900/10 bg-bone-50/85 backdrop-blur-md">
      <div className="bg-slate-900 py-1.5 text-center text-bone-100">
        <p className="label-mono">Free shipping over $75 · 30-day wear test</p>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="size-6 fill-forest-500" aria-hidden><path d="M2 14 L12 6 L22 14 L17 14 L12 10 L7 14 Z" /></svg>
          <span className="text-lg font-semibold tracking-tight">flybirds</span>
        </Link>
        <nav className="hidden gap-8 md:flex">
          {NAV.map(([label, href]) => (
            <Link key={href} href={href} className="label-mono text-slate-600 transition-colors hover:text-slate-950">{label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/search" className="label-mono hidden text-slate-600 hover:text-slate-950 sm:block">Search</Link>
          <CartButton />
        </div>
      </div>
    </header>
  );
}
