'use client';

import { useSiteSettings } from '@/lib/settings-context';

export default function Testimonials() {
  const { testimonials, testimonialsHeading, testimonialsSubtext } = useSiteSettings();

  return (
    <section className="bg-cream-alt py-14 sm:py-20">
      <div className="container-page">
        <div className="text-center">
          <p className="section-eyebrow">⭐ 4.9 de 5 en reseñas</p>
          <h2 className="section-title mt-2">{testimonialsHeading}</h2>
          <p className="mt-3 text-sm text-muted">{testimonialsSubtext}</p>
        </div>
        <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {testimonials.map((t) => (
            <figure key={t.name} className="w-[82%] shrink-0 snap-center rounded-2xl bg-white p-6 shadow-soft sm:w-[45%] lg:w-auto">
              <p className="text-lg text-primary">★★★★★</p>
              <blockquote className="mt-3 text-sm leading-relaxed text-ink">&ldquo;{t.review}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-black text-primary-light">
                  {t.name.charAt(0)}
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-ink">{t.name}</span>
                  <span className="block text-xs text-muted">📍 {t.city} · ✓ Compra verificada</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
