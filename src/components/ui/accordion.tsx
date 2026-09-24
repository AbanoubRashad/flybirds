"use client";

import * as A from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function Accordion({ items }: { items: { id: string; title: string; content: ReactNode }[] }) {
  return (
    <A.Root type="multiple" className="divide-y divide-slate-900/10 border-y border-slate-900/10">
      {items.map((it) => (
        <A.Item key={it.id} value={it.id}>
          <A.Header>
            <A.Trigger className="group flex w-full items-center justify-between py-4 text-left">
              <span className="label-mono text-slate-800">{it.title}</span>
              <Plus className="size-4 transition-transform duration-300 ease-out-expo group-data-[state=open]:rotate-45" />
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden text-sm text-slate-600 data-[state=closed]:animate-[collapse_200ms_ease-out] data-[state=open]:animate-[expand_250ms_ease-out]">
            <div className="pb-5">{it.content}</div>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
