"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * The URL is the single source of truth for catalog state: bookmarkable,
 * shareable, back-button friendly. `useTransition` keeps the current grid
 * interactive while the server re-renders the RSC payload.
 */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const getList = useCallback((key: string) => params.get(key)?.split(",").filter(Boolean) ?? [], [params]);

  const commit = useCallback(
    (next: URLSearchParams) => {
      next.sort();
      const qs = next.toString();
      startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [pathname, router],
  );

  const toggle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params);
      const cur = new Set(getList(key));
      if (cur.has(value)) cur.delete(value);
      else cur.add(value);
      if (cur.size) next.set(key, [...cur].join(","));
      else next.delete(key);
      commit(next);
    },
    [params, getList, commit],
  );

  const set = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params);
      if (value) next.set(key, value);
      else next.delete(key);
      commit(next);
    },
    [params, commit],
  );

  const clear = useCallback(() => commit(new URLSearchParams()), [commit]);

  return { params, getList, toggle, set, clear, isPending };
}
