"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * Renders overlays at <body>. The sticky header uses backdrop-filter, which
 * makes it the containing block for `position: fixed` descendants — sheets
 * rendered inside it would be clipped to the header's 76px.
 */
export function Portal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return mounted ? createPortal(children, document.body) : null;
}
