import type { ImageLoaderProps } from "next/image";

/**
 * Unsplash serves through imgix, which resizes and picks AVIF/WebP at the
 * edge. Asking it for the exact width `next/image` wants (instead of proxying
 * a large original through `/_next/image`) keeps srcsets small and fast.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src.startsWith("https://images.unsplash.com/")) return src;
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("auto", "format");
  url.searchParams.set("fit", "crop");
  return url.toString();
}
