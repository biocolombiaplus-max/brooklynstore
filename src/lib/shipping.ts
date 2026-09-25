import type { PaymentMethod, SiteSettings } from './types';
import { roundMoney } from './utils';

// Envío pagando por transferencia: gratis por defecto (defaultRate = 0) salvo
// en las provincias con tarifa propia configurada en el panel.
export function getTransferShipping(settings: SiteSettings, province: string): number {
  const rate = settings.shipping.rates.find((r) => r.province === province);
  return rate ? rate.rate : settings.shipping.defaultRate;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  payNow: number;
  payOnDelivery: number;
}

/**
 * Único lugar donde se calcula cuánto paga el cliente, para que el carrito,
 * la compra rápida, el checkout y el mensaje de WhatsApp siempre coincidan.
 *
 * - Transferencia/depósito: paga todo por adelantado (productos + envío de
 *   su provincia, gratis por defecto).
 * - Contra entrega: el envío vale lo que diga "codAdvance" ($5 por defecto) y
 *   es lo ÚNICO que adelanta; el valor de los productos se paga al recibir.
 */
export function computeOrderTotals(
  settings: SiteSettings,
  subtotal: number,
  method: PaymentMethod,
  province: string,
  couponPercent = 0,
): OrderTotals {
  const discount = roundMoney(subtotal * (couponPercent / 100));
  const net = roundMoney(subtotal - discount);

  if (method === 'contra_entrega') {
    const shipping = settings.payments.codAdvance;
    return {
      subtotal,
      discount,
      shipping,
      total: roundMoney(net + shipping),
      payNow: shipping,
      payOnDelivery: net,
    };
  }

  const shipping = province ? getTransferShipping(settings, province) : settings.shipping.defaultRate;
  const total = roundMoney(net + shipping);
  return { subtotal, discount, shipping, total, payNow: total, payOnDelivery: 0 };
}
