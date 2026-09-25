'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSiteSettings } from '@/lib/settings-context';
import { classNames, whatsappLinkTo } from '@/lib/utils';
import SafeImage from './SafeImage';
import { WhatsAppIcon } from './icons';

const ROTATE_MS = 5500;

function useRotatingIndex(length: number): number {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    setIndex(0);
    const id = setInterval(() => setIndex((i) => (i + 1) % length), ROTATE_MS);
    return () => clearInterval(id);
  }, [length]);
  return index;
}

const TITLE_SIZE_CLASSES: Record<string, string> = {
  sm: 'text-3xl sm:text-5xl lg:text-6xl',
  md: 'text-4xl sm:text-5xl lg:text-7xl',
  lg: 'text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[5.2rem]',
  xl: 'text-5xl sm:text-7xl lg:text-8xl',
};

const SUBTEXT_SIZE_CLASSES: Record<string, string> = {
  sm: 'text-sm sm:text-base',
  md: 'text-[15px] sm:text-lg',
  lg: 'text-lg sm:text-xl',
};

// Portada a pantalla completa estilo tiendas deportivas grandes: foto de
// fondo que rota con un zoom lento, texto grande en mayúsculas y dos
// botones bien visibles.
export default function Hero() {
  const { hero, storeName, whatsappCountryCode, whatsappNumber } = useSiteSettings();
  const images = hero.images.length > 0 ? hero.images : ['/hero-placeholder.svg'];
  const activeIndex = useRotatingIndex(images.length);

  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <div className="absolute inset-0 -z-10">
        {images.map((src, i) => (
          <div
            key={src + i}
            className={classNames(
              'absolute inset-0 transition-opacity duration-[1400ms] ease-in-out',
              i === activeIndex ? 'opacity-100' : 'opacity-0',
            )}
          >
            <SafeImage
              src={src}
              alt={storeName}
              fill
              priority={i === 0}
              sizes="100vw"
              className={classNames('object-cover', i === activeIndex && 'animate-kenburns')}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
      </div>

      <div className="container-page flex min-h-[78vh] flex-col justify-center py-16 sm:min-h-[82vh] lg:min-h-[86vh]">
        <div className="max-w-2xl animate-slideUp">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/60 bg-black/30 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary-light backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-primary-light" />
            {hero.eyebrow}
          </span>
          <h1
            className={classNames(
              'mt-5 font-heading font-black uppercase tracking-tight text-white',
              TITLE_SIZE_CLASSES[hero.titleSize] ?? TITLE_SIZE_CLASSES.lg,
            )}
          >
            {hero.heading}
          </h1>
          <span className="mt-5 block h-1 w-20 rounded-full bg-gold-gradient" />
          <p
            className={classNames(
              'mt-5 max-w-xl leading-relaxed text-white/85',
              SUBTEXT_SIZE_CLASSES[hero.subtextSize] ?? SUBTEXT_SIZE_CLASSES.md,
            )}
          >
            {hero.subtext}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={hero.button1Url} className="btn-primary btn-shine w-full text-base sm:w-auto">
              {hero.button1Text} →
            </Link>
            <Link href={hero.button2Url} className="btn-outline-light w-full text-base sm:w-auto">
              {hero.button2Text}
            </Link>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {[hero.badge1, hero.badge2, hero.badge3].filter(Boolean).map((badge, i) => (
              <span
                key={i}
                className="rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white ring-1 ring-white/20 backdrop-blur"
              >
                {badge}
              </span>
            ))}
          </div>

          <a
            href={whatsappLinkTo(whatsappNumber, `¡Hola ${storeName}! 👋 Quiero ver el catálogo`, whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white/90 underline-offset-4 hover:text-whatsapp hover:underline"
          >
            <WhatsAppIcon size={18} className="text-whatsapp" /> ¿Dudas? Escríbenos por WhatsApp, te atendemos ya mismo
          </a>
        </div>

        {images.length > 1 && (
          <div className="mt-10 flex gap-2">
            {images.map((_, i) => (
              <span
                key={i}
                className={classNames(
                  'h-1 rounded-full transition-all duration-500',
                  i === activeIndex ? 'w-10 bg-primary-light' : 'w-4 bg-white/40',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
