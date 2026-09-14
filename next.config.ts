import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
  // Photos use a per-component imgix loader (src/components/ui/photo.tsx); this stays as the optimizer allow-list.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default config;
