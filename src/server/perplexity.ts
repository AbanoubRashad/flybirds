import "server-only";

import Perplexity, { AuthenticationError, RateLimitError, type ResponseCreateResponse } from "@perplexity-ai/perplexity_ai";
import { env } from "@/lib/env";

/**
 * Web-grounded answers via the Perplexity Agent API (POST /v1/agent).
 * The "low" preset bundles a model with web_search + fetch_url, so answers
 * cite live sources. Server-only: the API key never reaches the browser.
 */

export type WebCitation = { url: string; title: string };

export type WebAnswer = {
  answer: string;
  citations: WebCitation[];
  responseId: string;
};

export class AskNotConfiguredError extends Error {
  constructor() {
    super("PERPLEXITY_API_KEY is not set.");
    this.name = "AskNotConfiguredError";
  }
}

const INSTRUCTIONS =
  "You are the Flybirds footwear store assistant. Answer shopper questions about shoes, " +
  "materials, sizing, care and sustainability concisely, using current web sources. " +
  "Do not invent Flybirds-specific prices, stock or policies.";

let client: Perplexity | undefined;

function getClient(): Perplexity {
  if (!env.PERPLEXITY_API_KEY) throw new AskNotConfiguredError();
  client ??= new Perplexity({ apiKey: env.PERPLEXITY_API_KEY });
  return client;
}

type Response = ResponseCreateResponse;

/** Prefer inline url_citation annotations; fall back to the search_results items. */
function collectCitations(output: Response["output"]): WebCitation[] {
  const seen = new Map<string, WebCitation>();
  const add = (url: unknown, title: unknown) => {
    if (typeof url === "string" && url && !seen.has(url)) {
      seen.set(url, { url, title: typeof title === "string" && title ? title : url });
    }
  };

  for (const item of output) {
    if (item.type === "message" && "content" in item && Array.isArray(item.content)) {
      for (const part of item.content) {
        for (const a of part.annotations ?? []) add(a.url, a.title);
      }
    }
  }
  if (seen.size === 0) {
    for (const item of output) {
      if (item.type === "search_results" && "results" in item && Array.isArray(item.results)) {
        for (const r of item.results) add(r.url, r.title);
      }
    }
  }
  return [...seen.values()].slice(0, 4);
}

/**
 * Ask a web-grounded question. Pass `previousResponseId` from an earlier
 * answer to continue the same conversation.
 */
export async function askWeb(question: string, previousResponseId?: string): Promise<WebAnswer> {
  const res = (await getClient().responses.create({
    preset: "low",
    input: question,
    instructions: INSTRUCTIONS,
    ...(previousResponseId ? { previous_response_id: previousResponseId } : {}),
  })) as Response;

  return {
    answer: res.output_text,
    citations: collectCitations(res.output),
    responseId: res.id,
  };
}

export { AuthenticationError, RateLimitError };
