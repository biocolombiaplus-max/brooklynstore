'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useSiteSettings } from '@/lib/settings-context';
import { buildCartWhatsAppMessage, formatPrice, whatsappLinkTo } from '@/lib/utils';
import SafeImage from '@/components/SafeImage';
import { CloseIcon, WhatsAppIcon } from '@/components/icons';

export default function CarritoPage() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity } = useCartStore();
  const settings = useSiteSettings();
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="container-page flex flex-col items-center justify-center py-24 text-center">
        <p className="mb-4 text-7xl">👟</p>
        <h1 className="section-title">Tu carrito está vacío</h1>
        <p className="mt-2 text-sm text-muted">Explora el catálogo y encuentra tu próximo par.</p>
        <Link href="/catalogo" className="btn-primary mt-8">
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <h1 className="section-title mb-8">Tu carrito</h1>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {items.map((item) => (
            <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-4 rounded-2xl border border-border p-4">
              <Link href={`/producto/${item.slug}`} className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-cream-alt">
                {item.image && <SafeImage src={item.image} alt={item.title} fill sizes="112px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    {item.brand && <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">{item.brand}</p>}
                    <p className="font-bold text-ink">{item.title}</p>
                    <p className="text-sm text-muted">
                      Talla <strong className="text-ink">{item.size}</strong>
                        {item.sizeUs && <span> (US {item.sizeUs})</span>}
                      {item.color && ` · ${item.color}`}
                    </p>
                  </div>
                  <button onClick={() => removeItem(item.productId, item.size, item.color)} className="h-fit text-muted hover:text-urgent" aria-label="Quitar">
                    <CloseIcon size={18} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-border">
                    <button className="h-9 w-9 font-bold" aria-label="Menos" onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}>
                      −
                    </button>
                    <span className="w-7 text-center font-black">{item.quantity}</span>
                    <button className="h-9 w-9 font-bold" aria-label="Más" onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}>
                      +
                    </button>
                  </div>
                  <span className="font-black text-ink">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="h-fit rounded-2xl bg-cream-alt p-6 lg:sticky lg:top-28">
          <h2 className="mb-4 text-lg font-black uppercase text-ink">Resumen</h2>
          <div className="flex justify-between text-sm text-muted">
            <span>Subtotal</span>
            <span className="font-bold text-ink">{formatPrice(subtotal)}</span>
          </div>
          <div className="mt-3 space-y-2 rounded-xl bg-white p-3 text-xs text-muted">
            <p>
              🏦 <strong className="text-ink">Transferencia o depósito Pichincha:</strong>{' '}
              {settings.shipping.defaultRate === 0 ? 'envío GRATIS' : `envío ${formatPrice(settings.shipping.defaultRate)}`}
            </p>
            {settings.payments.codEnabled && (
              <p>
                💵 <strong className="text-ink">Contra entrega:</strong> adelantas {formatPrice(settings.payments.codAdvance)} y el resto al recibir
              </p>
            )}
          </div>
          <Link href="/checkout" className="btn-primary btn-shine mt-5 w-full py-4 text-base">
            Finalizar compra →
          </Link>
          <a
            href={whatsappLinkTo(settings.whatsappNumber, buildCartWhatsAppMessage(items), settings.whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-ink hover:text-whatsapp"
          >
            <WhatsAppIcon size={16} className="text-whatsapp" /> O termina tu compra por WhatsApp
          </a>
          <Link href="/catalogo" className="mt-3 block text-center text-sm text-muted hover:text-ink">
            ← Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
