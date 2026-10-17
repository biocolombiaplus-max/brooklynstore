'use client';

import { useCartStore } from '@/lib/cart-store';
import { useSiteSettings } from '@/lib/settings-context';
import { computeOrderTotals } from '@/lib/shipping';
import { formatPrice } from '@/lib/utils';
import { sendOrderToWhatsApp } from '@/lib/whatsappOrder';
import { useEffect, useRef, useState } from 'react';
import { ecLocal, isEcMobile, savedPhone } from '@/lib/phone';
import { visitorContact } from '@/lib/visitor';
import EcPhoneInput from './EcPhoneInput';

// Botones del carrito: van directo a WhatsApp con el resumen y las fotos de
// todos los productos, según cómo quiera pagar.
export default function CartWhatsAppButtons({ onDone }: { onDone?: () => void }) {
  const items = useCartStore((s) => s.items);
  const settings = useSiteSettings();
  const cod = computeOrderTotals(settings, items, 'contra_entrega', '');
  const now = computeOrderTotals(settings, items, 'transferencia', '');
  const [phone, setPhone] = useState('');
  const [tried, setTried] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const phoneOk = isEcMobile(phone);
  useEffect(() => setPhone(savedPhone(visitorContact().phone)), []);

  function go(method: 'contra_entrega' | 'transferencia') {
    setTried(true);
    if (!phoneOk) {
      inputRef.current?.focus();
      return;
    }
    sendOrderToWhatsApp(items, method, settings, ecLocal(phone));
    onDone?.();
  }

  return (
    <div className="space-y-2.5">
      <div>
        <p className={`text-sm font-black ${tried && !phoneOk ? 'text-urgent' : 'text-ink'}`}>Tu número de WhatsApp</p>
        <p className="mb-2 text-[11px] text-muted">Para enviarte la foto real de tu par y tu guía de envío 📦</p>
        <EcPhoneInput ref={inputRef} value={phone} onChange={setPhone} invalid={tried && !phoneOk} />
        {tried && !phoneOk && <p className="mt-1 text-xs font-semibold text-urgent">Escribe tu celular, ej: 99 123 4567</p>}
      </div>
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
