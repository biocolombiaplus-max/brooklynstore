'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/lib/settings-context';

// Cinta de marcas en movimiento — cada marca lleva a su catálogo filtrado.
export default function BrandStrip() {
  const { brands } = useSiteSettings();
  if (brands.length === 0) return null;
  const loop = [...brands, ...brands, ...brands];

  return (
    <section className="overflow-hidden border-b border-border bg-white py-7">
      <p className="mb-4 text-center text-[11px] font-extrabold uppercase tracking-[0.25em] text-muted">
        Las marcas que te gustan, 100% originales
      </p>
      <div className="group relative flex overflow-hidden">
        <div className="flex w-max animate-marquee-slow items-center gap-12 pr-12 group-hover:[animation-play-state:paused] sm:gap-16 sm:pr-16">
          {loop.map((brand, i) => (
            <Link
              key={brand + i}
              href={`/catalogo?marca=${encodeURIComponent(brand)}`}
              className="whitespace-nowrap font-heading text-2xl font-black uppercase italic tracking-tight text-ink/25 transition-colors hover:text-primary sm:text-3xl"
            >
              {brand}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
