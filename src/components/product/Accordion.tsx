'use client';

import { useState } from 'react';
import { classNames } from '@/lib/utils';

export function AccordionItem({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 py-5 text-left" aria-expanded={open}>
        <span className="text-sm font-black uppercase tracking-wide text-ink">{title}</span>
        <span
          className={classNames(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-base font-bold transition-all',
            open ? 'rotate-45 bg-ink text-white' : 'bg-cream-alt text-ink',
          )}
        >
          +
        </span>
      </button>
      {open && <div className="animate-slideUp pb-6 text-sm leading-relaxed text-muted">{children}</div>}
    </div>
  );
}

export default function Accordion({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-border">{children}</div>;
}
