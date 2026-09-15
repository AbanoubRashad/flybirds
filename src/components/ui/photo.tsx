"use client";

import Image, { type ImageProps } from "next/image";
import imageLoader from "@/lib/image-loader";

/**
 * `next/image` preconfigured for Unsplash's imgix CDN: the browser requests
 * exactly-sized AVIF/WebP from the edge instead of proxying large originals
 * through `/_next/image`. A client component so the loader function can be
 * passed from server pages.
 */
export function Photo(props: ImageProps) {
  // eslint-disable-next-line jsx-a11y/alt-text -- alt is required by ImageProps and forwarded
  return <Image loader={imageLoader} {...props} />;
}
