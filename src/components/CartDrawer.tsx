'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useSiteSettings } from '@/lib/settings-context';
import { buildCartWhatsAppMessage, formatPrice, whatsappLinkTo } from '@/lib/utils';
import SafeImage from './SafeImage';
import { CloseIcon, WhatsAppIcon } from './icons';

export default function CartDrawer() {
  const [mounted, setMounted] = useState(false);
  const { items, isOpen, close, removeItem, updateQuantity } = useCartStore();
  const settings = useSiteSettings();
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/60" onClick={close} />
      <div className="relative flex h-full w-full max-w-md animate-slideUp flex-col bg-white shadow-dark">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-lg font-black uppercase text-ink">Tu carrito ({totalUnits})</h2>
          <button onClick={close} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-alt">
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="mb-4 text-6xl">👟</p>
              <p className="text-lg font-black uppercase text-ink">Tu carrito está vacío</p>
              <p className="mt-1 text-sm text-muted">Dale una vuelta al catálogo, hay modelos full bacanes.</p>
              <Link href="/catalogo" onClick={close} className="btn-primary mt-6">
                Ver catálogo
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={`${item.productId}-${item.size}-${item.color}`} className="flex gap-3 rounded-2xl border border-border p-3">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-alt">
                    {item.image && <SafeImage src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      {item.brand && <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">{item.brand}</p>}
                      <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                      <p className="text-xs text-muted">
                        Talla <strong className="text-ink">{item.size}</strong>
                        {item.sizeUs && <span> (US {item.sizeUs})</span>}
                        {item.color && ` · ${item.color}`}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center rounded-full border border-border">
                        <button
                          className="h-8 w-8 text-sm font-bold"
                          aria-label="Menos"
                          onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                        <button
                          className="h-8 w-8 text-sm font-bold"
                          aria-label="Más"
                          onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <span className="text-sm font-black text-ink">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.size, item.color)}
                    aria-label="Quitar"
                    className="self-start text-muted hover:text-urgent"
                  >
                    <CloseIcon size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-center justify-between text-base font-black text-ink">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <p className="mb-4 mt-1 text-xs text-muted">
              🚚 Envío con Servientrega a todo el Ecuador · se calcula al pagar
              {settings.payments.codEnabled && ` · 💵 Contra entrega: adelantas ${formatPrice(settings.payments.codAdvance)}`}
            </p>
            <Link href="/checkout" onClick={close} className="btn-primary btn-shine w-full py-4 text-base">
              Finalizar compra →
            </Link>
            <a
              href={whatsappLinkTo(settings.whatsappNumber, buildCartWhatsAppMessage(items), settings.whatsappCountryCode)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-ink hover:text-whatsapp"
            >
              <WhatsAppIcon size={16} className="text-whatsapp" /> O termina tu compra hablando con nosotros
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
