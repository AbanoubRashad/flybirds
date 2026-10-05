import type { NextConfig } from "next";

// Static-demo config (used only by `npm run build:demo`): plain HTML/JS in
// `out/`, ready for Firebase Hosting. The full app uses the root next.config.ts.
const config: NextConfig = {
  output: "export",
  reactStrictMode: true,
  // No `/_next/image` optimizer in a static export: every next/image goes
  // through the same imgix loader the app's <Photo> component already uses.
  images: { loader: "custom", loaderFile: "./src/lib/image-loader.ts" },
  eslint: { ignoreDuringBuilds: true },
};

export default config;
