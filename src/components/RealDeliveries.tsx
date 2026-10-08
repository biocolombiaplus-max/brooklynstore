'use client';

import { useState } from 'react';
import { useSiteSettings } from '@/lib/settings-context';
import SafeImage from './SafeImage';

// "Entregas reales": fotos de clientes y paquetes despachados que sube la
// tienda desde el panel. Solo aparece con al menos 3 fotos reales.
export default function RealDeliveries({ compact = false }: { compact?: boolean }) {
  const { realDeliveries } = useSiteSettings();
  const [open, setOpen] = useState<string | null>(null);
  const photos = realDeliveries.photos.filter(Boolean);
  if (!realDeliveries.enabled || photos.length < 3) return null;

  return (
    <section className={compact ? 'mt-8' : 'bg-white py-12 sm:py-16'}>
      <div className={compact ? '' : 'container-page'}>
        <p className="section-eyebrow">Clientes reales · pedidos reales</p>
        <h2 className={compact ? 'mt-1 text-lg font-black uppercase text-ink' : 'section-title mt-2'}>{realDeliveries.heading}</h2>
        <div className="no-scrollbar -mx-4 mt-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {photos.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setOpen(src)}
              className={`relative shrink-0 snap-start overflow-hidden rounded-2xl bg-cream-alt ${compact ? 'h-32 w-32' : 'h-44 w-44 sm:h-56 sm:w-56'}`}
              aria-label="Ver foto de entrega"
            >
              <SafeImage src={src} alt="Entrega real de Brooklyn Store" fill sizes="224px" className="object-cover" />
            </button>
          ))}
        </div>
      </div>
      {open && (
        <button type="button" onClick={() => setOpen(null)} className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/85 p-4" aria-label="Cerrar">
          <span className="relative block h-[80vh] w-full max-w-lg">
            <SafeImage src={open} alt="Entrega real" fill sizes="512px" className="object-contain" />
          </span>
        </button>
      )}
    </section>
  );
}
