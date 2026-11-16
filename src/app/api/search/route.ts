import { NextResponse } from "next/server";
import { suggestProducts } from "@/server/queries/search";
import { MAX_QUERY_LENGTH, MIN_QUERY_LENGTH, normalizeQuery } from "@/server/queries/search-terms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Suggestions for the search overlay: GET /api/search?q=merino → up to 6 ranked products. */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("q") ?? "";
  if (raw.length > MAX_QUERY_LENGTH * 2) return NextResponse.json({ error: "query too long" }, { status: 400 });
  const q = normalizeQuery(raw);
  if (q.length < MIN_QUERY_LENGTH) return NextResponse.json({ q, suggestions: [] });
  const suggestions = await suggestProducts(q);
  // The catalog changes rarely; a short shared cache keeps typing snappy without going stale.
  return NextResponse.json({ q, suggestions }, { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } });
}
