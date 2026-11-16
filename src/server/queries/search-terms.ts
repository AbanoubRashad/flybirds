// Pure helpers for search (no DB), so they can be unit-tested and reused by the static demo.

export const MIN_QUERY_LENGTH = 2;
export const MAX_QUERY_LENGTH = 80;

/** Trim, collapse whitespace and cap the length. */
export function normalizeQuery(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}

/**
 * A `to_tsquery` string where every word is a prefix match and all must match:
 * "merino ru" → "merino:* & ru:*". Only letters and digits survive, so the
 * result is always a valid tsquery and never carries operators from the user.
 * Returns null when nothing searchable is left.
 */
export function toPrefixTsQuery(raw: string): string | null {
  const tokens = (normalizeQuery(raw).toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).slice(0, 6).map((t) => t.slice(0, 30));
  return tokens.length ? tokens.map((t) => `${t}:*`).join(" & ") : null;
}

/** Escape `%`, `_` and `\` so user text is matched literally inside a LIKE pattern. */
export function escapeLike(raw: string): string {
  return raw.replace(/[\\%_]/g, (c) => `\\${c}`);
}
