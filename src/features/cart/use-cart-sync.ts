"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { reconcileCart } from "@/server/actions/cart";
import { useCart } from "./store";

/**
 * Background reconciliation: the UI mutates Zustand instantly (optimistic),
 * then after a 400ms quiet period we validate against the DB. Rapid +/- clicks
 * collapse into one round-trip, and stale responses are discarded by revision.
 */
export function useCartSync() {
  const revision = useCart((s) => s.revision);
  const [notices, setNotices] = useState<string[]>([]);
  const inFlightRev = useRef(0);

  const { mutate, isPending } = useMutation({
    mutationFn: reconcileCart,
    onSuccess: (data) => {
      if (inFlightRev.current !== useCart.getState().revision) return; // superseded
      const n = useCart.getState().applyServer(data);
      if (n.length) setNotices(n);
    },
  });

  useEffect(() => {
    const t = setTimeout(() => {
      inFlightRev.current = revision;
      const lines = useCart.getState().lines.map(({ variantId, quantity }) => ({ variantId, quantity }));
      mutate(lines);
    }, 400);
    return () => clearTimeout(t);
  }, [revision, mutate]);

  return { isSyncing: isPending, notices, dismiss: () => setNotices([]) };
}
