'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { CartItem, PaymentMethod } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import SafeImage from '@/components/SafeImage';
import { CloseIcon } from '@/components/icons';

// Compra rápida desde la ficha del producto: sin pasar por el carrito, el
// cliente llena sus datos en una sola ventana y confirma por WhatsApp.
export default function QuickBuyModal({
  items,
  initialMethod,
  onClose,
}: {
  items: CartItem[];
  initialMethod: PaymentMethod;
  onClose: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[94vh] w-full max-w-lg animate-slideUp overflow-y-auto rounded-t-3xl bg-white shadow-dark sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Finalizar compra"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary">Compra rápida y segura</p>
            <h2 className="text-lg font-black uppercase text-ink">Finaliza tu pedido</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-alt">
            <CloseIcon />
          </button>
        </div>

        <div className="px-5 pb-8 pt-5">
          <ul className="mb-6 space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-3 rounded-2xl bg-cream-alt/70 p-3">
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white">
                  {item.image && <SafeImage src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  {item.brand && <span className="block text-[10px] font-extrabold uppercase tracking-widest text-primary">{item.brand}</span>}
                  <span className="block truncate text-sm font-bold text-ink">{item.title}</span>
                  <span className="block text-xs text-muted">
                    Talla <strong className="text-ink">{item.size}</strong>
                    {item.color && ` · ${item.color}`} · x{item.quantity}
                  </span>
                </span>
                <span className="text-sm font-black text-ink">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>

          <CheckoutForm items={items} initialMethod={initialMethod} onSuccess={(id) => router.push(`/pedido-confirmado/${id}`)} />
        </div>
      </div>
    </div>
  );
}
