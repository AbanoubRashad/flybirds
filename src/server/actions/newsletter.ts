"use server";

import { z } from "zod";

const schema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
});

export type NewsletterState =
  | { status: "idle" }
  | { status: "error"; message: string; email: string }
  | { status: "success"; email: string };

/**
 * Validates and accepts a newsletter sign-up. There is no subscriber table
 * yet, so this is where an ESP call (or a `Subscriber` model) plugs in.
 */
export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Enter a valid email address.", email: String(formData.get("email") ?? "") };
  }
  return { status: "success", email: parsed.data.email };
}
