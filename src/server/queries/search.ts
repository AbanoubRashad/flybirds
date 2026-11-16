import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { MIN_QUERY_LENGTH, escapeLike, normalizeQuery, toPrefixTsQuery } from "./search-terms";

export type SearchHit = { id: string; score: number };

/**
 * Ranked product ids for a query. Three signals, best first:
 *  1. full-text prefix match on name (A), tagline (B), description (C)   — index: product_search_fts_idx
 *  2. trigram similarity on the name, for typos                           — index: product_search_trgm_idx
 *  3. a material that contains the text ("merino")
 * The indexes come from `prisma/sql/search.sql`. If that script was never run
 * (no pg_trgm), the query falls back to a plain case-insensitive match.
 */
export async function searchProductIds(raw: string, limit = 60): Promise<SearchHit[]> {
  const q = normalizeQuery(raw);
  if (q.length < MIN_QUERY_LENGTH) return [];
  const tsQuery = toPrefixTsQuery(q);
  const like = `%${escapeLike(q.toLowerCase())}%`;

  try {
    return await db.$queryRaw<SearchHit[]>(Prisma.sql`
      SELECT p.id,
        (
          ${tsQuery === null ? Prisma.sql`0` : Prisma.sql`ts_rank(
            setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(p.tagline, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(p.description, '')), 'C'),
            to_tsquery('english', ${tsQuery})
          ) * 4`}
          + word_similarity(${q.toLowerCase()}, lower(p.name)) * 2
          + CASE WHEN lower(p.name) LIKE ${like} THEN 1 ELSE 0 END
        )::float8 AS score
      FROM "Product" p
      WHERE p."isActive"
        AND (
          ${tsQuery === null ? Prisma.sql`false` : Prisma.sql`(
            setweight(to_tsvector('english', coalesce(p.name, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(p.tagline, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(p.description, '')), 'C')
          ) @@ to_tsquery('english', ${tsQuery})`}
          OR word_similarity(${q.toLowerCase()}, lower(p.name)) > 0.45
          OR lower(p.name) LIKE ${like}
          OR EXISTS (SELECT 1 FROM unnest(p.materials) m WHERE lower(m) LIKE ${like})
        )
      ORDER BY score DESC, p.name ASC
      LIMIT ${limit}
    `);
  } catch (err) {
    console.warn("[search] ranked search unavailable (run `npm run db:search`); using a plain match.", err instanceof Error ? err.message : err);
    const rows = await db.product.findMany({
      where: { isActive: true, OR: [{ name: { contains: q, mode: "insensitive" } }, { tagline: { contains: q, mode: "insensitive" } }, { materials: { has: q } }] },
      select: { id: true },
      orderBy: { name: "asc" },
      take: limit,
    });
    return rows.map((r, i) => ({ id: r.id, score: rows.length - i }));
  }
}

export type Suggestion = { name: string; slug: string; price: number; category: string; gender: "MEN" | "WOMEN" | "UNISEX"; image: string | null; color: string | null };

/** Top matches for the search overlay, in rank order. */
export async function suggestProducts(raw: string, limit = 6): Promise<Suggestion[]> {
  const hits = await searchProductIds(raw, limit);
  if (!hits.length) return [];
  const products = await db.product.findMany({
    where: { id: { in: hits.map((h) => h.id) } },
    select: {
      id: true, name: true, slug: true, basePrice: true, gender: true,
      category: { select: { name: true } },
      variants: { select: { images: true, color: true }, take: 1, orderBy: { color: "asc" } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return hits.flatMap((h) => {
    const p = byId.get(h.id);
    if (!p) return [];
    const v = p.variants[0];
    return [{ name: p.name, slug: p.slug, price: p.basePrice, category: p.category.name, gender: p.gender, image: v?.images[0] ?? null, color: v?.color ?? null }];
  });
}
