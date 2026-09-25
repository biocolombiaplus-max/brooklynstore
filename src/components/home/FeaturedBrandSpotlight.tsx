'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getActiveProducts } from '@/lib/products';
import { useSiteSettings } from '@/lib/settings-context';
import { brandHref, isStarBrand } from '@/lib/brand';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/types';
import SafeImage from '../SafeImage';

// Bloque premium de la marca estrella (la que más vende la tienda): fondo
// negro con brillo dorado, la foto del zapato flotando, beneficios y sus
// modelos disponibles. Todo se edita en /admin/configuracion → Marca estrella.
export default function FeaturedBrandSpotlight() {
  const { featuredBrand: fb } = useSiteSettings();
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

  return (
    <section className="relative isolate overflow-hidden bg-ink text-white">
      {/* Fondo: brillo dorado + nombre gigante de la marca como marca de agua */}
      <div className="pointer-events-none absolute -right-40 top-1/2 -z-10 h-[620px] w-[620px] -translate-y-1/2 rounded-full bg-primary/25 blur-[120px]" />
      <div className="pointer-events-none absolute -left-32 -top-32 -z-10 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-10 right-0 -z-10 select-none font-heading text-[42vw] font-black leading-none tracking-tighter text-white/[0.03] lg:text-[26vw]">
        {fb.name}
      </span>

      <div className="container-page grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <div className="order-2 lg:order-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-gold-gradient px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-ink shadow-lift">
            ⭐ {fb.eyebrow}
          </span>
          <h2 className="mt-6 font-heading text-4xl font-black uppercase leading-[1.02] tracking-tight sm:text-6xl">
            <span className="text-gold-gradient">{fb.heading}</span>
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">{fb.text}</p>

          <ul className="mt-7 grid max-w-lg grid-cols-2 gap-2.5">
            {fb.bullets.map((b) => (
              <li key={b} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-bold sm:text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-[10px] text-ink">✓</span>
                {b}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={href} className="btn-primary btn-shine text-base">
              {fb.buttonText} →
            </Link>
            <Link href={href} className="btn-outline-light text-base">
              Ver todos los modelos
            </Link>
          </div>

          <div className="mt-9 grid max-w-lg grid-cols-3 divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] py-4 text-center">
            <div>
              <p className="text-xl font-black text-primary-light sm:text-2xl">{sold > 0 ? `+${sold}` : '4.9★'}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{sold > 0 ? 'Pares vendidos' : 'Calificación'}</p>
            </div>
            <div>
              <p className="text-xl font-black text-primary-light sm:text-2xl">{fromPrice ? formatPrice(fromPrice) : '100%'}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">{fromPrice ? 'Desde' : 'Originales'}</p>
            </div>
            <div>
              <p className="text-xl font-black text-primary-light sm:text-2xl">$5</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Y el resto al recibir</p>
            </div>
          </div>
        </div>

        {/* Zapato flotando */}
        <Link href={href} className="group relative order-1 block lg:order-2" aria-label={`Ver ${fb.name}`}>
          <div className="relative mx-auto aspect-[4/3] w-full max-w-2xl">
            <div className="absolute inset-x-[12%] bottom-[6%] h-[12%] rounded-[50%] bg-black/70 blur-2xl transition-transform duration-700 group-hover:scale-90" />
            <div className="absolute inset-0 animate-float">
              {fb.image && (
                <SafeImage
                  src={fb.image}
                  alt={`${fb.name} — zapatos originales`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="-rotate-6 object-contain drop-shadow-[0_35px_45px_rgba(0,0,0,0.55)] transition-transform duration-700 group-hover:-rotate-3 group-hover:scale-105"
                />
              )}
            </div>
            <span className="absolute right-2 top-2 flex h-20 w-20 animate-attention items-center justify-center rounded-full bg-gold-gradient text-center text-[10px] font-black uppercase leading-tight text-ink shadow-lift sm:h-24 sm:w-24 sm:text-xs">
              <span>
                ⭐<br />
                {fb.badge}
              </span>
            </span>
          </div>
        </Link>
      </div>

      {products.length > 0 && (
        <div className="border-t border-white/10 bg-black/40">
          <div className="container-page no-scrollbar flex gap-3 overflow-x-auto py-5">
            {products.slice(0, 6).map((p) => (
              <Link
                key={p.id}
                href={`/producto/${p.slug}`}
                className="group flex min-w-[260px] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 pr-4 transition-colors hover:border-primary"
              >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                  {p.images[0] && <SafeImage src={p.images[0]} alt={p.title} fill sizes="64px" className="object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{p.title}</span>
                  <span className="text-sm font-black text-primary-light">{formatPrice(p.price)}</span>
                  <span className="ml-2 text-[11px] font-bold text-white/50 group-hover:text-white">Comprar →</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
