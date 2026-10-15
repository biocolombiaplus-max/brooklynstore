'use client';

import { useCartStore } from '@/lib/cart-store';
import { useSiteSettings } from '@/lib/settings-context';
import { computeOrderTotals } from '@/lib/shipping';
import { formatPrice } from '@/lib/utils';
import { sendOrderToWhatsApp } from '@/lib/whatsappOrder';

// Botones del carrito: van directo a WhatsApp con el resumen y las fotos de
// todos los productos, según cómo quiera pagar.
export default function CartWhatsAppButtons({ onDone }: { onDone?: () => void }) {
  const items = useCartStore((s) => s.items);
  const settings = useSiteSettings();
  const cod = computeOrderTotals(settings, items, 'contra_entrega', '');
  const now = computeOrderTotals(settings, items, 'transferencia', '');

  function go(method: 'contra_entrega' | 'transferencia') {
    sendOrderToWhatsApp(items, method, settings);
    onDone?.();
  }

  return (
    <div className="space-y-2.5">
      {settings.payments.codEnabled && (
        <button type="button" onClick={() => go('contra_entrega')} className="btn-buy btn-shine btn-buy-pulse w-full flex-col gap-0.5 py-3.5">
          <span>👉 Pedir por WhatsApp · contra entrega</span>
          <span className="text-[11px] font-bold normal-case tracking-normal opacity-90">
            Pagas {formatPrice(cod.payOnDelivery)} al recibir + {formatPrice(cod.payNow)} envío
          </span>
        </button>
      )}
      <button type="button" onClick={() => go('transferencia')} className="btn-buy btn-shine w-full flex-col gap-0.5 py-3.5">
        <span>👉 Pedir por WhatsApp · pagar de inmediato</span>
        <span className="text-[11px] font-bold normal-case tracking-normal opacity-90">{formatPrice(now.total)} por transferencia, envío incluido</span>
      </button>
      <p className="text-center text-[11px] text-muted">
        Se abre WhatsApp con tu pedido y las fotos: <strong className="text-ink">solo toca Enviar</strong>. No pagas nada en la página.
      </p>
    </div>
  );
}
