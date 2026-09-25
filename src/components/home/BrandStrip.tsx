'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/lib/settings-context';
import { isStarBrand } from '@/lib/brand';
import { classNames } from '@/lib/utils';

// Cinta de marcas en movimiento — cada marca lleva a su catálogo filtrado.
export default function BrandStrip() {
  const { brands, featuredBrand } = useSiteSettings();
  if (brands.length === 0) return null;
  const loop = [...brands, ...brands, ...brands];

  return (
    <section className="overflow-hidden border-b border-border bg-white py-7">
      <p className="mb-4 text-center text-[11px] font-extrabold uppercase tracking-[0.25em] text-muted">
        Las marcas que más te gustan
      </p>
      <div className="group relative flex overflow-hidden">
        <div className="flex w-max animate-marquee-slow items-center gap-12 pr-12 group-hover:[animation-play-state:paused] sm:gap-16 sm:pr-16">
          {loop.map((brand, i) => (
            <Link
              key={brand + i}
              href={`/catalogo?marca=${encodeURIComponent(brand)}`}
              className={classNames(
                'whitespace-nowrap font-heading font-black uppercase italic tracking-tight transition-colors hover:text-primary',
                isStarBrand(featuredBrand, brand)
                  ? 'flex items-center gap-2 rounded-full border border-primary/60 bg-ink px-6 py-2 text-2xl not-italic normal-case text-white sm:text-3xl'
                  : 'text-2xl text-ink/25 sm:text-3xl',
              )}
            >
              {isStarBrand(featuredBrand, brand) && (
                <span className="rounded-full bg-gold-gradient px-1.5 py-0.5 font-display text-[11px] italic text-ink">Nº1</span>
              )}
              {brand}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
