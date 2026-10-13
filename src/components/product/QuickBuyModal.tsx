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
        <div className="sticky top-0 z-20 border-b border-border bg-white/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-black uppercase text-ink">Último paso 🙌</h2>
            <button onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-alt">
              <CloseIcon />
            </button>
          </div>
          <ul className="mt-2 space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream-alt">
                  {item.image && <SafeImage src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink">{item.title}</span>
                  <span className="block truncate text-[11px] text-muted">
                    Talla <strong className="text-ink">{item.size}</strong>
                        {item.sizeUs && <span> (US {item.sizeUs})</span>}
                    {item.color && ` · ${item.color}`} · x{item.quantity}
                  </span>
                </span>
                <span className="text-sm font-black text-ink">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 pt-4">

          <CheckoutForm items={items} initialMethod={initialMethod} onSuccess={(id, opened) => router.push(`/pedido-confirmado/${id}${opened ? '' : '?abrir=1'}`)} />
        </div>
      </div>
    </div>
  );
}
