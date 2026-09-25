'use client';

import { useSiteSettings } from '@/lib/settings-context';

export default function TrustBar() {
  const { trustItems } = useSiteSettings();

  return (
    <div className="border-b border-border bg-white">
      <div className="container-page no-scrollbar flex gap-6 overflow-x-auto py-4 sm:grid sm:grid-cols-5 sm:gap-4 sm:py-5">
        {trustItems.map((item) => (
          <div key={item.title} className="flex min-w-[170px] items-center gap-3 sm:min-w-0">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-50 text-lg ring-1 ring-primary/30">
              {item.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-extrabold uppercase tracking-wide text-ink">{item.title}</span>
              <span className="block text-[11px] text-muted">{item.sub}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
