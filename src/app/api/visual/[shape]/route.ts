import type { NextRequest } from "next/server";

/**
 * Procedural product renders so the repo ships with zero binary assets and
 * zero third-party imagery. Each variant image is a deterministic SVG tinted by
 * colorHex and viewed from one of four "angles". Swap for a CDN in prod.
 */
const PATHS: Record<string, string> = {
  sneaker: "M40 190 C40 150 90 140 130 120 L200 80 C230 70 260 90 290 110 L360 150 C380 160 380 190 370 200 L50 210 Z",
  runner: "M30 195 C40 150 100 135 140 110 L210 70 C240 60 270 85 300 110 L375 150 C390 165 385 195 370 200 L40 210 Z",
  slipon: "M40 195 C50 165 110 150 160 140 L250 130 C300 130 350 150 370 175 C375 190 370 200 360 202 L50 208 Z",
  boot: "M60 205 L60 90 C60 70 80 60 110 60 L190 60 C210 60 215 80 215 100 L220 130 L340 160 C370 170 375 195 365 205 Z",
  flat: "M40 195 C60 170 120 160 180 160 L300 160 C340 162 370 175 372 192 C372 202 360 206 350 206 L50 206 Z",
  tee: "M140 60 L180 50 C190 70 210 70 220 50 L260 60 L320 100 L295 135 L270 120 L270 220 L130 220 L130 120 L105 135 L80 100 Z",
  hoodie: "M150 60 C170 30 230 30 250 60 L310 90 L330 180 L295 185 L285 130 L280 225 L120 225 L115 130 L105 185 L70 180 L90 90 Z",
  shorts: "M110 70 L290 70 L310 200 L220 205 L200 120 L180 205 L90 200 Z",
  sock: "M170 40 L240 40 L240 160 C240 190 280 190 320 190 C345 190 350 225 320 225 L200 225 C170 225 170 200 170 170 Z",
  insole: "M110 200 C80 200 80 150 100 110 C120 60 160 40 200 40 C260 40 300 80 300 130 C300 180 270 200 240 200 Z",
  kit: "M90 90 L310 90 L310 210 L90 210 Z M150 90 L150 70 L250 70 L250 90",
  bag: "M70 100 L330 100 L345 215 L55 215 Z M150 100 C150 60 250 60 250 100",
};

const hexRe = /^#[0-9a-fA-F]{6}$/;

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt)).toString(16).padStart(2, "0");
  return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ shape: string }> }) {
  const { shape } = await params;
  const hexParam = req.nextUrl.searchParams.get("hex") ?? "#2B3136";
  const hex = hexRe.test(hexParam) ? hexParam : "#2B3136";
  const angle = Math.min(3, Math.max(0, Number(req.nextUrl.searchParams.get("angle")) || 0));
  const d = PATHS[shape] ?? PATHS.sneaker!;
  const transforms = ["", "translate(400 0) scale(-1 1)", "translate(40 20) scale(0.9) rotate(-8 200 150)", "translate(200 150) scale(1.15) translate(-200 -150)"];
  const bg = ["#EDE8DD", "#E6E0D3", "#DFE4DC", "#F3EFE6"][angle];

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="800" height="600">
  <rect width="400" height="300" fill="${bg}"/>
  <g stroke="#1C2226" stroke-opacity=".08">${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="300"/>`).join("")}</g>
  <ellipse cx="205" cy="232" rx="165" ry="10" fill="#1C2226" opacity=".12"/>
  <g transform="${transforms[angle]}">
    <path d="${d}" fill="${hex}" stroke="${shade(hex, -40)}" stroke-width="2" stroke-linejoin="round"/>
    <path d="${d}" fill="url(#g)" opacity=".5"/>
    ${["sneaker", "runner", "slipon", "boot", "flat"].includes(shape) ? `<rect x="40" y="198" width="335" height="10" rx="4" fill="${shade(hex, 90)}"/>` : ""}
  </g>
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#000" stop-opacity=".15"/></linearGradient></defs>
  <text x="16" y="286" font-family="monospace" font-size="10" fill="#4F585E" letter-spacing="1">FB/${shape.toUpperCase()} · ${hex.toUpperCase()} · VIEW 0${angle + 1}</text>
</svg>`;

  return new Response(svg, {
    headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
