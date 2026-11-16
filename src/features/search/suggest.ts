import type { Suggestion } from "@/server/queries/search";

export type { Suggestion };

/** Live suggestions for the search overlay. (The static demo swaps this file for one without a server.) */
export async function fetchSuggestions(q: string, signal?: AbortSignal): Promise<Suggestion[]> {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal });
  if (!res.ok) throw new Error(`search failed: ${res.status}`);
  return ((await res.json()) as { suggestions: Suggestion[] }).suggestions;
}
