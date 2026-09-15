/**
 * Photography lives on Unsplash's imgix CDN. Every photo is a typed constant
 * with its alt text and a tiny tinted blur placeholder, so pages never guess.
 */

export type PhotoKey = "hero" | "trail" | "running" | "boots" | "city" | "apparel" | "bag" | "wool" | "forest";

export interface Photo {
  id: string;
  alt: string;
  /** Two dominant tones, used to build the blur placeholder. */
  tones: [string, string];
}

export const PHOTOS: Record<PhotoKey, Photo> = {
  hero: { id: "photo-1530143311094-34d807799e8f", alt: "A trail runner crossing a golden alpine meadow above a sea of cloud", tones: ["#cfdde8", "#c9b58a"] },
  trail: { id: "photo-1530792271526-7ddf516473b3", alt: "Leather hiking boot stepping across mossy rocks in a rushing stream", tones: ["#3c4639", "#7d7466"] },
  running: { id: "photo-1590646299178-1b26ab821e34", alt: "A runner mid-stride on a forest trail lined with ferns", tones: ["#3f5a2c", "#7a8a52"] },
  boots: { id: "photo-1606036525923-525fa3b35465", alt: "A pair of worn brown leather boots on a woven rug by stacked firewood", tones: ["#d8d3cc", "#7a5c40"] },
  city: { id: "photo-1636601170757-ac7a5e19b7ed", alt: "Looking down at pale knit sneakers on a red-brick city sidewalk", tones: ["#6b3b30", "#8b5446"] },
  apparel: { id: "photo-1771610463037-d19a49592ffe", alt: "A person in a grey hoodie looking out over open countryside", tones: ["#8fa3ad", "#9aa0a2"] },
  bag: { id: "photo-1448582649076-3981753123b5", alt: "A tan canvas travel duffel resting on a wooden floor beside a chair", tones: ["#d9d0c4", "#9a6a3c"] },
  wool: { id: "photo-1595026525047-dfa997df8a4a", alt: "Close-up texture of undyed knitted merino wool", tones: ["#d6d8d2", "#bfc2bb"] },
  forest: { id: "photo-1601307426703-20d19577e455", alt: "Evergreen forest disappearing into low mountain fog", tones: ["#9ea2a1", "#2f3a2f"] },
};

export interface Crop {
  /** Focal point 0–1 and zoom ≥ 1 — imgix `crop=focalpoint`. */
  x?: number;
  y?: number;
  zoom?: number;
}

const BASE = "https://images.unsplash.com";

/** Builds `https://images.unsplash.com/<id>?w=<width>&q=75&auto=format&fit=crop` (+ optional focal crop). */
export function unsplash(id: string, width = 1600, crop?: Crop): string {
  const params = new URLSearchParams({ w: String(width), q: "75", auto: "format", fit: "crop" });
  if (crop) {
    params.set("crop", "focalpoint");
    params.set("fp-x", String(crop.x ?? 0.5));
    params.set("fp-y", String(crop.y ?? 0.5));
    params.set("fp-z", String(crop.zoom ?? 1));
  }
  return `${BASE}/${id}?${params.toString()}`;
}

export const photoSrc = (key: PhotoKey, width = 1600, crop?: Crop) => unsplash(PHOTOS[key].id, width, crop);

const toBase64 = (s: string) => (typeof window === "undefined" ? Buffer.from(s).toString("base64") : window.btoa(s));

/** A 10×8 SVG gradient — a few hundred bytes, renders instantly while the photo streams in. */
export function blurFor(tones: [string, string]): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="8"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${tones[0]}"/><stop offset="1" stop-color="${tones[1]}"/></linearGradient></defs><rect width="10" height="8" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;base64,${toBase64(svg)}`;
}

export const photoBlur = (key: PhotoKey) => blurFor(PHOTOS[key].tones);

/** Neutral placeholder for catalog images whose tones we don't know ahead of time. */
export const NEUTRAL_BLUR = blurFor(["#E6E0D3", "#d8d1c2"]);

/** Seeded products may still point at the procedural SVG route (kept as a fallback). */
export const isLocalSvg = (src: string) => src.startsWith("/api/visual");
