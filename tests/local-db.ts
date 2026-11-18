/**
 * Integration and browser tests write to the database, so they only run
 * against a local one. A hosted DATABASE_URL (Neon, Supabase, RDS…) is refused.
 */
export function isLocalDatabase(url = process.env.DATABASE_URL ?? ""): boolean {
  try {
    const host = new URL(url).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "db" || host === "postgres";
  } catch {
    return false;
  }
}
