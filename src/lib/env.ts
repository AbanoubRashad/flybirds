import { z } from "zod";

// Fail fast at boot rather than at the first request that needs a secret.
const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16),
  AUTH_GITHUB_ID: z.string().optional(),
  AUTH_GITHUB_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  // Optional: the storefront boots without it; /api/ask returns 503 until it's set.
  PERPLEXITY_API_KEY: z.string().min(1).optional(),
  // Optional: without a Stripe key, checkout runs in sandbox mode (see src/server/stripe.ts).
  STRIPE_SECRET_KEY: z.string().startsWith("sk_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
});

export const env = schema.parse(process.env);
