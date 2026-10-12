"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";

type Citation = { url: string; title: string };
type Answer = { answer: string; citations: Citation[]; responseId: string };
type Turn = { question: string } & Answer;

const SUGGESTIONS = ["How do I clean these?", "Are they good for wide feet?", "How long do they last?"];

/** Strip the light markdown the model may return so it reads as plain prose. */
function tidy(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[(\d+)\]/g, "").trim();
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function AskPanel({ productName, tagline }: { productName: string; tagline: string }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    const text = q.trim();
    if (text.length < 3 || pending) return;
    setPending(true);
    setError(null);
    const last = turns.at(-1);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: last ? text : `A shopper is looking at the "${productName}" (${tagline}). Their question: ${text}`,
          ...(last && { previousResponseId: last.responseId }),
        }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok || !data || typeof data !== "object" || !("answer" in data)) {
        const msg = data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : null;
        throw new Error(msg ?? "Something went wrong. Please try again.");
      }
      setTurns((t) => [...t, { question: text, ...(data as Answer) }]);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void ask(question);
  }

  return (
    <section aria-labelledby="ask-title" className="mt-24 border-t border-line pt-16 md:mt-32">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
        <div>
          <p className="label-mono inline-flex items-center gap-2 text-forest"><Sparkles className="size-3.5" aria-hidden />Ask about this shoe</p>
          <h2 id="ask-title" className="display mt-4 text-[clamp(32px,3.6vw,48px)] leading-[1.05]">Questions before the trail?</h2>
          <p className="mt-4 max-w-[380px] text-muted">Answers are researched live on the web, with sources you can check. For orders, sizing swaps and returns, contact our team.</p>
        </div>

        <div>
          <ol className="space-y-3" aria-live="polite">
            <AnimatePresence initial={false}>
              {turns.map((t, i) => (
                <motion.li key={t.responseId + i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[20px] bg-sand/60 p-5 sm:p-6">
                  <p className="text-sm font-semibold">{t.question}</p>
                  <p className="mt-3 whitespace-pre-line text-muted">{tidy(t.answer)}</p>
                  {t.citations.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2" aria-label="Sources">
                      {t.citations.map((c) => (
                        <li key={c.url}>
                          <a href={c.url} target="_blank" rel="noopener noreferrer" title={c.title} className="label-mono inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-slate ring-1 ring-inset ring-line-strong transition-colors hover:bg-slate hover:text-bone">
                            {hostOf(c.url)}<ArrowUpRight className="size-3" aria-hidden />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>

          {turns.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => void ask(s)} disabled={pending} className="rounded-full px-4 py-2 text-sm ring-1 ring-inset ring-line-strong transition-colors hover:bg-slate hover:text-bone disabled:opacity-40">
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className={turns.length ? "mt-4" : "mt-5"} noValidate>
            <label htmlFor="ask-input" className="sr-only">{turns.length ? "Ask a follow-up question" : "Ask a question about this shoe"}</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                id="ask-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                maxLength={500}
                placeholder={turns.length ? "Ask a follow-up." : "e.g. Can I wear these in the rain?"}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "ask-error" : undefined}
                className="h-12 w-full min-w-0 rounded-full px-5 ring-1 ring-inset ring-line-strong placeholder:text-muted transition-shadow focus:outline-none focus:ring-2 focus:ring-forest sm:flex-1"
              />
              <Button type="submit" variant="primary" size="md" className="h-12" disabled={pending || question.trim().length < 3}>
                {pending ? "Researching." : "Ask"}
              </Button>
            </div>
            <p id="ask-error" aria-live="polite" className="mt-2 min-h-5 text-sm text-[#a64f12]">{error}</p>
          </form>
        </div>
      </div>
    </section>
  );
}
