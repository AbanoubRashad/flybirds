-- Search indexes for the storefront (Phase 3). Safe to run again.
-- Run with: npm run db:search   (after `npm run db:push`)
--
-- These are expression indexes, which Prisma's schema cannot describe; Prisma ignores
-- them, so `prisma db push` neither creates nor drops them.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text: name and tagline weigh more than the long description.
CREATE INDEX IF NOT EXISTS product_search_fts_idx ON "Product" USING GIN ((
  setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(tagline, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'C')
));

-- Trigram: tolerates typos and matches inside words ("runer" → "Runner").
CREATE INDEX IF NOT EXISTS product_search_trgm_idx ON "Product" USING GIN (lower(name) gin_trgm_ops);
