'use client';

import { useState } from 'react';
import { useSiteSettings } from '@/lib/settings-context';
import { classNames } from '@/lib/utils';

export default function Faq() {
  const { faqs } = useSiteSettings();
  const [open, setOpen] = useState<number | null>(0);
  if (faqs.length === 0) return null;

  return (
    <section id="preguntas" className="scroll-mt-24 bg-white py-14 sm:py-20">
      <div className="container-page max-w-3xl">
        <div className="text-center">
          <p className="section-eyebrow">Resolvemos tus dudas</p>
          <h2 className="section-title mt-2">Preguntas frecuentes</h2>
        </div>
        <div className="mt-10 divide-y divide-border rounded-2xl border border-border">
          {faqs.map((f, i) => (
            <div key={f.question}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-7"
                aria-expanded={open === i}
              >
                <span className="text-sm font-extrabold text-ink sm:text-base">{f.question}</span>
                <span
                  className={classNames(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-all',
                    open === i ? 'rotate-45 bg-ink text-white' : 'bg-cream-alt text-ink',
                  )}
                >
                  +
                </span>
              </button>
              {open === i && <p className="animate-slideUp px-5 pb-6 text-sm leading-relaxed text-muted sm:px-7">{f.answer}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
