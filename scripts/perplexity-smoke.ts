/**
 * Minimal real request to the Perplexity Agent API.
 * Prints only the status and the response shape — never the key or the answer body.
 * Run: npm run perplexity:smoke   (needs PERPLEXITY_API_KEY in your environment or .env.local)
 */
import Perplexity, { APIError } from "@perplexity-ai/perplexity_ai";

if (!process.env.PERPLEXITY_API_KEY) {
  console.error("PERPLEXITY_API_KEY is not set. Create one at https://console.perplexity.ai and set it in .env.local.");
  process.exit(1);
}

const client = new Perplexity({ maxRetries: 0 });

try {
  const res = await client.responses.create({ preset: "fast", input: "What is a shoe's heel-to-toe drop? One sentence." });
  console.log("HTTP 200");
  console.log({
    id: typeof res.id,
    status: res.status,
    model: res.model,
    output_text_chars: res.output_text.length,
    output_types: res.output.map((o) => o.type),
    usage_keys: res.usage ? Object.keys(res.usage) : [],
  });
} catch (err) {
  if (err instanceof APIError) {
    const hint = err.status === 401 ? " (authentication/key problem)" : err.status === 429 ? ` (rate limited; Retry-After: ${err.headers?.get("retry-after") ?? "n/a"})` : "";
    console.error(`HTTP ${err.status ?? "?"}${hint}`);
  } else {
    console.error("Request failed:", err instanceof Error ? err.name : "unknown");
  }
  process.exit(1);
}
