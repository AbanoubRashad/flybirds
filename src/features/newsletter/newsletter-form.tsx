"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { subscribeToNewsletter, type NewsletterState } from "@/server/actions/newsletter";

const initial: NewsletterState = { status: "idle" };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  const error = state.status === "error" ? state.message : null;

  return (
    <div className="relative min-h-[112px]">
      <AnimatePresence mode="wait" initial={false}>
        {state.status === "success" ? (
          <motion.div key="done" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sage text-slate"><Check className="size-5" aria-hidden /></span>
            <div>
              <p className="font-serif text-2xl text-bone">You&apos;re on the list.</p>
              <p className="mt-1 text-sm text-bone/75">The next trail notes will land at <span className="text-bone">{state.email}</span>.</p>
            </div>
          </motion.div>
        ) : (
          <motion.form key="form" action={action} noValidate initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} className="w-full">
            <label htmlFor="newsletter-email" className="label-mono text-bone/75">Email address</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                defaultValue={state.status === "error" ? state.email : undefined}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "newsletter-error" : undefined}
                className="h-12 w-full min-w-0 rounded-full sm:flex-1 bg-bone/10 px-5 text-bone ring-1 ring-inset ring-bone/25 placeholder:text-bone/55 transition-shadow focus:outline-none focus:ring-2 focus:ring-sage"
              />
              <Button type="submit" variant="ember" size="md" className="h-12" disabled={pending}>
                {pending ? "Subscribing…" : "Subscribe"}
              </Button>
            </div>
            <p id="newsletter-error" aria-live="polite" className="mt-2 min-h-5 text-sm text-[#f3b98d]">{error}</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
