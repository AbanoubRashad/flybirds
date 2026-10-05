// Builds the static live demo into ./out, ready for `firebase deploy`.
//
// The full app needs a Node server and PostgreSQL. The demo is the same UI
// exported as static files: it copies the app into .demo-build/, lays the
// files from demo/overlay/ over it (in-memory catalog, browser-side
// filtering, no auth), drops the server-only routes, and runs `next build`.
// Your working tree is never modified.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const work = join(root, ".demo-build");
const out = join(root, "out");

const COPY = ["src", "prisma", "public", "package.json", "tsconfig.json", "postcss.config.mjs"];

// Server-only pieces with no static equivalent (Auth.js, Prisma, middleware, route handlers).
const REMOVE = [
  "src/middleware.ts",
  "src/auth.ts",
  "src/auth.config.ts",
  "src/app/api",
  "src/types/next-auth.d.ts",
  "src/lib/db.ts",
  "src/lib/env.ts",
  "prisma/seed.ts",
];

const rm = (p) => rmSync(p, { recursive: true, force: true, maxRetries: 5 });

rm(work);
for (const entry of COPY) {
  const from = join(root, entry);
  if (existsSync(from)) cpSync(from, join(work, entry), { recursive: true });
}
cpSync(join(root, "demo", "overlay"), work, { recursive: true });
for (const entry of REMOVE) rm(join(work, entry));

const nextBin = join(root, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(nextBin)) {
  console.error("Next.js isn't installed yet. Run `npm install` first.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: work,
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "https://flybirds-store.web.app",
  },
});

if (result.status === 0) {
  rm(out);
  cpSync(join(work, "out"), out, { recursive: true });
  console.log("\nStatic demo written to ./out — deploy it with `npm run deploy:demo`.");
}
rm(work);
process.exit(result.status ?? 1);
