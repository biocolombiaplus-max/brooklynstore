'use client';

import { useSiteSettings } from '@/lib/settings-context';

export default function Benefits() {
  const { benefits, benefitsHeading } = useSiteSettings();

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container-page">
        <div className="text-center">
          <p className="section-eyebrow">Compra con confianza</p>
          <h2 className="section-title mt-2">{benefitsHeading}</h2>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border p-6 transition-all duration-300 hover:border-primary hover:shadow-lift">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-50 text-2xl ring-1 ring-primary/30">{b.icon}</span>
              <h3 className="mt-4 text-base font-black uppercase text-ink">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
