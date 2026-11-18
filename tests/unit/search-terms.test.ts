import { describe, expect, it } from "vitest";
import { escapeLike, normalizeQuery, toPrefixTsQuery } from "@/server/queries/search-terms";
import { isLocalDatabase } from "../local-db";

describe("search terms", () => {
  it("normalizes whitespace and caps the length", () => {
    expect(normalizeQuery("  merino   wool \n tee ")).toBe("merino wool tee");
    expect(normalizeQuery("x".repeat(200))).toHaveLength(80);
  });

  it("builds a prefix tsquery from words only", () => {
    expect(toPrefixTsQuery("Merino ru")).toBe("merino:* & ru:*");
    expect(toPrefixTsQuery("tempo-runner 2")).toBe("tempo:* & runner:* & 2:*");
  });

  it("drops tsquery operators and quotes, so user text can never break the query", () => {
    expect(toPrefixTsQuery("wool & !tee | (boot):* 'x'")).toBe("wool:* & tee:* & boot:* & x:*");
    expect(toPrefixTsQuery("!!! &&& ()")).toBeNull();
    expect(toPrefixTsQuery("")).toBeNull();
  });

  it("keeps at most six words", () => {
    expect(toPrefixTsQuery("a b c d e f g h")!.split(" & ")).toHaveLength(6);
  });

  it("escapes LIKE wildcards", () => {
    expect(escapeLike("100%_wool\\")).toBe("100\\%\\_wool\\\\");
  });
});

describe("isLocalDatabase", () => {
  it("accepts local hosts and refuses hosted databases", () => {
    expect(isLocalDatabase("postgresql://postgres:postgres@localhost:5432/flybirds")).toBe(true);
    expect(isLocalDatabase("postgresql://u:p@127.0.0.1:5432/x")).toBe(true);
    expect(isLocalDatabase("postgresql://u:p@ep-example-pooler.us-east-2.aws.neon.tech/neondb")).toBe(false);
    expect(isLocalDatabase("postgresql://u:p@db.abcdefgh.supabase.co:5432/postgres")).toBe(false);
    expect(isLocalDatabase("")).toBe(false);
  });
});
