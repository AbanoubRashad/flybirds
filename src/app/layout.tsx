import type { Metadata, Viewport } from "next";
import { Instrument_Serif, JetBrains_Mono, Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import { AnnouncementBar } from "@/components/layout/announcement-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Toaster } from "@/components/ui/toast";
import { CartDrawer } from "@/features/cart/cart-drawer";
import "./globals.css";

const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
// Manrope and JetBrains Mono are variable fonts: omitting `weight` loads one file covering the whole range.
const sans = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: { default: "Flybirds — Technical footwear from natural materials", template: "%s · Flybirds" },
  description: "Performance footwear and basics engineered from merino, eucalyptus and sugarcane — with the carbon footprint printed on every box.",
};

export const viewport: Viewport = { themeColor: "#F4F1EA" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <head>
        {/* All photography streams from Unsplash's CDN; open the connection before the hero asks for it. */}
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body className="min-h-dvh font-sans">
        <a href="#main" className="label-mono sr-only z-60 rounded-full bg-slate px-4 py-3 text-bone focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Skip to content
        </a>
        <Providers>
          <AnnouncementBar />
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
          <CartDrawer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
