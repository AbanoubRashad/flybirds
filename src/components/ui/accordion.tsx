"use client";

import * as A from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

export function Accordion({ items, defaultValue }: { items: { id: string; title: ReactNode; content: ReactNode }[]; defaultValue?: string[] }) {
  return (
    <A.Root type="multiple" defaultValue={defaultValue} className="divide-y divide-line border-y border-line">
      {items.map((it) => (
        <A.Item key={it.id} value={it.id}>
          <A.Header asChild>
            <h2>
            <A.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-[15px] font-semibold">
              {it.title}
              <span className="grid size-9 shrink-0 place-items-center rounded-full ring-1 ring-inset ring-line-strong transition-colors duration-300 group-hover:bg-slate group-hover:text-bone group-data-[state=open]:bg-slate group-data-[state=open]:text-bone">
                <Plus className="size-4 transition-transform duration-500 ease-brand group-data-[state=open]:rotate-45" aria-hidden />
              </span>
            </A.Trigger>
            </h2>
          </A.Header>
          <A.Content className="overflow-hidden text-[15px] leading-relaxed text-muted data-[state=closed]:animate-[acc-out_150ms_ease-out] data-[state=open]:animate-[acc-in_450ms_cubic-bezier(.16,1,.3,1)]">
            <div className="pb-6">{it.content}</div>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
