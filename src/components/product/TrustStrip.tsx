'use client';

import SafeImage from '@/components/SafeImage';
import { useSiteSettings } from '@/lib/settings-context';

// Prueba social arriba del botón de compra: fotos reales de entregas y
// chats de clientes (las mismas de las secciones de abajo), con un toque
// para verlas. Quien llega de un anuncio ve de una que la tienda es real.
export default function TrustStrip() {
  const { realDeliveries, chatProofs } = useSiteSettings();
  const deliveries = realDeliveries.enabled ? realDeliveries.photos.filter(Boolean) : [];
  const chats = chatProofs.enabled ? chatProofs.photos.filter(Boolean) : [];
  const thumbs = [...deliveries.slice(0, 3), ...chats.slice(0, 1)].slice(0, 4);
  if (thumbs.length === 0) return null;
  const total = deliveries.length + chats.length;

  return (
    <a
      href="#pruebas"
      className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-2.5 pr-4 shadow-soft ring-1 ring-primary/30 transition-transform active:scale-[0.99]"
    >
      <span className="flex shrink-0 -space-x-3">
        {thumbs.map((src, i) => (
          <span key={i} className="relative h-11 w-11 overflow-hidden rounded-full bg-cream-alt ring-2 ring-white">
            <SafeImage src={src} alt="" fill sizes="64px" className="object-cover" hideOnError />
          </span>
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black text-ink">Clientes reales en todo Ecuador ✓</span>
        <span className="block text-[11px] text-muted">
          Mira {total} {total === 1 ? 'entrega y chat real' : 'entregas y chats reales'} 👉 clic aquí
        </span>
      </span>
    </a>
  );
}
