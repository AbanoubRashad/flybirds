import { z } from "zod";

// ─── URL-driven filter contract (shared by the page + filter sidebar) ─────
// Pure (no DB, no `server-only`) so the static demo can parse the same URLs
// in the browser.

export const SORTS = ["featured", "price-asc", "price-desc", "newest", "eco"] as const;

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(",").filter(Boolean) : []));

export const catalogParamsSchema = z.object({
  q: z.string().trim().max(80).optional(),
  gender: z.enum(["MEN", "WOMEN", "UNISEX"]).optional(),
  sub: csv,
  size: csv,
  color: csv,
  material: csv,
  min: z.coerce.number().int().nonnegative().optional(),
  max: z.coerce.number().int().positive().optional(),
  sort: z.enum(SORTS).catch("featured"),
});
export type CatalogParams = z.infer<typeof catalogParamsSchema>;

/** Accepts Next's searchParams shape and never throws — bad params are dropped. */
export function parseCatalogParams(sp: Record<string, string | string[] | undefined>): CatalogParams {
  const flat = Object.fromEntries(Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : v]));
  const res = catalogParamsSchema.safeParse(flat);
  return res.success ? res.data : catalogParamsSchema.parse({});
}
