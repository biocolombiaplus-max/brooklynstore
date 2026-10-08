'use client';

import { useState } from 'react';
import { useSiteSettings } from '@/lib/settings-context';
import SafeImage from './SafeImage';
import { WhatsAppIcon } from './icons';

// Capturas reales de WhatsApp de clientes felices, dentro de un marco de
// celular (como lo muestran las grandes tiendas). Se administran en
// Configuración → Capturas de WhatsApp. Aparece con al menos 2 capturas.
export default function ChatProofs({ compact = false }: { compact?: boolean }) {
  const { chatProofs } = useSiteSettings();
  const [open, setOpen] = useState<number | null>(null);
  const photos = chatProofs.photos.filter(Boolean);
  if (!chatProofs.enabled || photos.length < 1) return null;

  return (
    <section className={compact ? 'relative mt-10 overflow-hidden rounded-3xl bg-[#0a0a0a] py-8 text-white' : 'relative overflow-hidden bg-[#0a0a0a] py-14 text-white sm:py-20'}>
      <span className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(37,211,102,0.18),transparent_70%)]" />
      <span className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.22),transparent_70%)]" />
      <div className={compact ? 'relative px-5' : 'container-page relative'}>
        <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-whatsapp">
          <WhatsAppIcon size={14} /> Clientes reales · mensajes reales
        </p>
        <h2 className={compact ? 'mt-2 font-heading text-xl font-black uppercase' : 'mt-2 font-heading text-3xl font-black uppercase sm:text-4xl'}>
          {chatProofs.heading}
        </h2>
        {chatProofs.subheading && <p className="mt-1 text-sm text-white/60">{chatProofs.subheading}</p>}

        <div className="no-scrollbar -mx-5 mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
          {photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setOpen(i)}
              aria-label="Ver captura completa"
              className={`group relative shrink-0 snap-center rounded-[30px] bg-[#1c1c1e] p-[7px] shadow-[0_20px_50px_rgba(0,0,0,0.55)] ring-1 ring-white/15 transition-transform duration-300 hover:-translate-y-1 ${
                compact ? 'w-[170px]' : 'w-[200px] sm:w-[230px]'
              }`}
            >
              {/* Pantalla del celular */}
              <span className="relative block aspect-[9/17] overflow-hidden rounded-[24px] bg-[#0b141a]">
                <span className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-black" />
                <SafeImage src={src} alt="Mensaje de un cliente por WhatsApp" fill sizes="240px" className="object-cover object-top" />
              </span>
              <span className="absolute -bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-whatsapp px-2.5 py-1 text-[10px] font-extrabold text-white shadow-soft">
                ✓ Cliente real
              </span>
            </button>
          ))}
        </div>
        <p className="mt-5 text-[11px] text-white/40">Ocultamos números y fotos de perfil para cuidar la privacidad de nuestros clientes.</p>
      </div>

      {open !== null && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <span className="relative block h-[88vh] w-full max-w-sm">
            <SafeImage src={photos[open]} alt="Mensaje de un cliente por WhatsApp" fill sizes="420px" className="object-contain" />
          </span>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open - 1 + photos.length) % photos.length);
                }}
                className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white"
                aria-label="Anterior"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen((open + 1) % photos.length);
                }}
                className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-xl text-white"
                aria-label="Siguiente"
              >
                ›
              </button>
            </>
          )}
          <span className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">✕ Cerrar</span>
        </div>
      )}
    </section>
  );
}
