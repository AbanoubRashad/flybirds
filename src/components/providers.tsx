"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { useState, type ReactNode } from "react";
import { EASE } from "@/lib/motion";

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } }));
  return (
    <QueryClientProvider client={client}>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.6, ease: EASE }}>
        {children}
      </MotionConfig>
    </QueryClientProvider>
  );
}
