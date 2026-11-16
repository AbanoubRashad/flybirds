// Static demo: no /api/search. The overlay still submits to the search page, which filters in the browser.
export type Suggestion = { name: string; slug: string; price: number; category: string; gender: "MEN" | "WOMEN" | "UNISEX"; image: string | null; color: string | null };

export async function fetchSuggestions(_q: string, _signal?: AbortSignal): Promise<Suggestion[]> {
  return [];
}
