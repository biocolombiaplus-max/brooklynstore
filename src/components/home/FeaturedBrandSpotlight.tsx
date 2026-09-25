'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getActiveProducts } from '@/lib/products';
import { useSiteSettings } from '@/lib/settings-context';
import { brandHref, brandTagline, isStarBrand } from '@/lib/brand';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/types';
import SafeImage from '../SafeImage';
import ShoeStage from '../brand/ShoeStage';
import StarSeal from '../brand/StarSeal';

// Bloque premium de la marca estrella: nombre gigante, lema en serif
// itálica dorada, zapato sobre un escenario con foco de luz y sello Nº1.
// Todo se edita en /admin/configuracion → Marca estrella.
export default function FeaturedBrandSpotlight() {
  const { featuredBrand: fb, payments } = useSiteSettings();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    getActiveProducts()
      .then((list) => !cancelled && setProducts(list.filter((p) => isStarBrand(fb, p.brand))))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fb]);

  if (!fb.enabled || !fb.name) return null;

  const sold = products.reduce((sum, p) => sum + (p.soldCount ?? 0), 0);
  const fromPrice = products.length ? Math.min(...products.map((p) => p.price)) : null;
  const href = brandHref(fb.name);
  const tagline = brandTagline(fb);

  const stats = [
    sold > 0 ? { value: `+${sold}`, label: 'Pares vendidos' } : { value: '4.9', label: 'Calificación' },
    fromPrice ? { value: formatPrice(fromPrice), label: 'Desde' } : { value: '4.9★', label: 'Calificación' },
    payments.codEnabled ? { value: formatPrice(payments.codAdvance), label: 'Y el resto al recibir' } : { value: '24-72h', label: 'Entrega' },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-[#070707] text-white">
      {/* Atmósfera: halo dorado, viñeta y líneas finas */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_40%,rgba(184,146,58,0.22),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_10%_100%,rgba(184,146,58,0.10),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="container-page grid items-center gap-6 pb-14 pt-12 sm:pb-20 sm:pt-16 lg:grid-cols-[1fr_1.1fr] lg:gap-10 lg:py-24">
        {/* Zapato */}
        <Link href={href} className="relative order-1 block lg:order-2" aria-label={`Ver ${fb.name}`}>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
            <span className="select-none font-heading text-[42vw] font-black leading-none tracking-tighter text-white/[0.04] sm:text-[30vw] lg:text-[17vw]">
              {fb.name}
            </span>
          </span>
          {fb.image && <ShoeStage src={fb.image} alt={`${fb.name} — zapatos`} sizes="(max-width: 1024px) 100vw, 55vw" className="mx-auto aspect-[16/11] w-full max-w-2xl" />}
          <StarSeal label={fb.badge} className="absolute right-0 top-0 w-24 text-[15px] sm:w-32 sm:text-[20px] lg:-right-2 lg:top-2" />
        </Link>

        {/* Texto */}
        <div className="order-2 lg:order-1">
          <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.35em] text-primary-light sm:text-[11px]">
            <span className="h-px w-10 bg-gold-gradient" />
            {fb.eyebrow}
          </p>
          <h2 className="mt-5">
            <span className="block font-heading text-7xl font-black leading-[0.85] tracking-tight text-white sm:text-8xl lg:text-[8.5rem]">{fb.name}</span>
            {tagline && (
              <span className="mt-3 block font-display text-3xl italic leading-tight text-gold-gradient sm:text-5xl">{tagline}</span>
            )}
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/65">{fb.text}</p>

          <ul className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 border-t border-white/10">
            {fb.bullets.map((b, i) => (
              <li key={b} className="flex items-baseline gap-3 border-b border-white/10 py-3.5">
                <span className="font-display text-sm italic text-primary">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[13px] font-semibold text-white/90 sm:text-sm">{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link href={href} className="btn-primary btn-shine text-base">
              {fb.buttonText} →
            </Link>
            <Link
              href={href}
              className="btn-base border border-white/25 text-white hover:border-primary hover:text-primary-light"
            >
              Ver colección
            </Link>
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3">
            {stats.map((s, i) => (
              <div key={s.label} className={`flex flex-col-reverse ${i > 0 ? 'border-l border-white/10 pl-4 sm:pl-6' : ''}`}>
                <dt className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-white/45 sm:text-[10px]">{s.label}</dt>
                <dd className="font-display text-2xl text-gold-gradient sm:text-3xl">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {products.length > 0 && (
        <div className="border-t border-white/10">
          <div className="container-page no-scrollbar flex gap-3 overflow-x-auto py-5">
            {products.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href={`/producto/${p.slug}`}
                className="group flex min-w-[270px] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-2.5 pr-5 transition-all hover:border-primary/70 hover:bg-white/[0.06]"
              >
                <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-white to-[#e9e5dd]">
                  {p.images[0] && <SafeImage src={p.images[0]} alt={p.title} fill sizes="80px" className="object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{p.title}</span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="font-display text-base text-gold-gradient">{formatPrice(p.price)}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 transition-colors group-hover:text-primary-light">
                      Comprar →
                    </span>
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
