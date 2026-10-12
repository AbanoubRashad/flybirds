import type { NextRequest } from "next/server";
import { z } from "zod";
import { AskNotConfiguredError, AuthenticationError, RateLimitError, askWeb } from "@/server/perplexity";

/**
 * POST /api/ask  { question, previousResponseId? }
 * -> { answer, citations: [{ url, title }], responseId }
 * Web-grounded shopper Q&A backed by the Perplexity Agent API.
 */
const schema = z.object({
  question: z.string().trim().min(3, "Ask a longer question.").max(1000),
  previousResponseId: z.string().trim().min(1).max(200).optional(),
});

export async function POST(req: NextRequest) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  try {
    const result = await askWeb(parsed.data.question, parsed.data.previousResponseId);
    return Response.json(result);
  } catch (err) {
    if (err instanceof AskNotConfiguredError) {
      return Response.json({ error: "Ask is not configured on this server." }, { status: 503 });
    }
    if (err instanceof RateLimitError) {
      const retryAfter = err.headers?.get("retry-after") ?? "10";
      return Response.json({ error: "Too many requests. Try again shortly." }, { status: 429, headers: { "Retry-After": retryAfter } });
    }
    if (err instanceof AuthenticationError) {
      console.error("[ask] Perplexity rejected the API key (401). Check or rotate PERPLEXITY_API_KEY.");
      return Response.json({ error: "Ask is temporarily unavailable." }, { status: 502 });
    }
    console.error("[ask] Perplexity request failed:", err instanceof Error ? err.message : "unknown error");
    return Response.json({ error: "Ask is temporarily unavailable." }, { status: 502 });
  }
}
