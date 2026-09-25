'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { classNames } from '@/lib/utils';
import SafeImage from '../SafeImage';

// Galería: en celular las fotos se deslizan con el dedo (scroll-snap) con
// indicadores; en PC, foto grande + miniaturas y zoom al pasar el mouse.
export default function ProductGallery({
  images,
  title,
  discountPercent = 0,
  isNew = false,
  colorImage,
}: {
  images: string[];
  title: string;
  discountPercent?: number;
  isNew?: boolean;
  colorImage?: string;
}) {
  const gallery = useMemo(() => (images.length > 0 ? images : ['/hero-placeholder.svg']), [images]);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colorImage) return;
    const index = gallery.indexOf(colorImage);
    if (index >= 0) goTo(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorImage, gallery]);

  function goTo(index: number) {
    setActive(index);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: track.clientWidth * index, behavior: 'smooth' });
  }

  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== active) setActive(index);
  }

  const badges = (
    <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
      {discountPercent > 0 && (
        <span className="rounded-full bg-urgent px-3 py-1.5 text-xs font-extrabold text-white shadow-soft">-{discountPercent}% OFF</span>
      )}
      {isNew && (
        <span className="rounded-full bg-ink px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-light">
          Nuevo
        </span>
      )}
    </div>
  );

  return (
    <div className="lg:sticky lg:top-28">
      {/* Móvil: carrusel deslizable */}
      <div className="relative -mx-4 sm:mx-0 lg:hidden">
        {badges}
        <div
          ref={trackRef}
          onScroll={handleScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-2xl"
        >
          {gallery.map((src, i) => (
            <div key={src + i} className="relative aspect-square w-full shrink-0 snap-center bg-cream-alt">
              <SafeImage src={src} alt={`${title} — foto ${i + 1}`} fill priority={i === 0} sizes="100vw" className="object-cover" />
            </div>
          ))}
        </div>
        {gallery.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-white/80 px-2.5 py-1.5 backdrop-blur">
            {gallery.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Foto ${i + 1}`}
                className={classNames('h-1.5 rounded-full transition-all', i === active ? 'w-5 bg-ink' : 'w-1.5 bg-ink/30')}
              />
            ))}
          </div>
        )}
      </div>

      {/* PC: foto grande con zoom + miniaturas */}
      <div className="hidden gap-4 lg:flex">
        {gallery.length > 1 && (
          <div className="flex w-20 shrink-0 flex-col gap-3">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActive(i)}
                onMouseEnter={() => setActive(i)}
                className={classNames(
                  'relative aspect-square overflow-hidden rounded-xl border-2 bg-cream-alt transition-all',
                  active === i ? 'border-ink' : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <SafeImage src={src} alt={`${title} ${i + 1}`} fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
        <div
          className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-3xl bg-cream-alt"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setZoom({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
          }}
          onMouseLeave={() => setZoom(null)}
        >
          {badges}
          <SafeImage
            src={gallery[active]}
            alt={title}
            fill
            priority
            sizes="50vw"
            className="object-cover transition-transform duration-200"
            style={zoom ? { transform: 'scale(1.8)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
