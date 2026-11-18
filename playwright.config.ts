import { defineConfig, devices } from "@playwright/test";
import { isLocalDatabase } from "./tests/local-db";

/**
 * Browser tests place orders and write reviews, so they only run against a
 * local database: `docker compose up -d db`, then point DATABASE_URL at it.
 * Run the site (`npm run dev` or `npm run build && npm start`), then `npm run test:e2e`.
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

if (process.env.DATABASE_URL && !isLocalDatabase()) {
  throw new Error("Refusing to run browser tests: DATABASE_URL is not a local database.");
}

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  outputDir: "test-results",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1360, height: 900 } } }],
});
