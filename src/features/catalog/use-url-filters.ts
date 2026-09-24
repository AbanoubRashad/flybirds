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
      cur.has(value) ? cur.delete(value) : cur.add(value);
      cur.size ? next.set(key, [...cur].join(",")) : next.delete(key);
      commit(next);
    },
    [params, getList, commit],
  );

  const set = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params);
      value ? next.set(key, value) : next.delete(key);
      commit(next);
    },
    [params, commit],
  );

  const clear = useCallback(() => commit(new URLSearchParams()), [commit]);

  return { params, getList, toggle, set, clear, isPending };
}
