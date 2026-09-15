import Image, { type ImageProps } from "next/image";
import { isLocalSvg, NEUTRAL_BLUR } from "@/lib/images";
import { Photo } from "./photo";

/**
 * Catalog images come from the DB: Unsplash URLs after the new seed, or the
 * legacy `/api/visual` SVGs. SVGs skip the optimizer and the blur placeholder.
 */
export function ProductImage({ src, alt, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  if (isLocalSvg(src)) return <Image src={src} alt={alt} unoptimized {...props} />;
  return <Photo src={src} alt={alt} placeholder="blur" blurDataURL={NEUTRAL_BLUR} {...props} />;
}
