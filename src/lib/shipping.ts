import type { PaymentMethod, SiteSettings } from './types';
import { roundMoney } from './utils';

// Envío pagando por transferencia: tarifa general (defaultRate, $5) salvo
// en las provincias con tarifa propia configurada en el panel.
export function getTransferShipping(settings: SiteSettings, province: string): number {
  const rate = settings.shipping.rates.find((r) => r.province === province);
  return rate ? rate.rate : settings.shipping.defaultRate;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  // Se mantiene por compatibilidad: el envío siempre se cobra aparte.
  shippingIncluded: boolean;
  total: number;
  payNow: number;
  payOnDelivery: number;
}

export interface PricedItem {
  price: number;
  codPrice?: number;
  quantity: number;
}

// Precio unitario pagando contra entrega (lo que se paga en efectivo al
// recibir): el precio contra entrega del producto, el general del panel ($68)
// o, si ninguno está configurado, el precio normal.
export function codUnitPrice(item: { price: number; codPrice?: number | null }, settings?: SiteSettings): number {
  if (item.codPrice && item.codPrice > 0) return item.codPrice;
  const general = settings?.payments.codUnitPrice ?? 0;
  return general > 0 ? general : item.price;
}

/**
 * Único lugar donde se calcula cuánto paga el cliente, para que el carrito,
 * la compra rápida, el checkout y el mensaje de WhatsApp siempre coincidan.
 *
 * - Transferencia/depósito: paga todo por adelantado (productos + envío de
 *   su provincia, $5 por defecto).
 * - Contra entrega: hoy adelanta solo el envío (codAdvance, $5) y al recibir
 *   paga en efectivo el precio contra entrega de cada par ($68).
 */
export function computeOrderTotals(
  settings: SiteSettings,
  items: PricedItem[],
  method: PaymentMethod,
  province: string,
  couponPercent = 0,
): OrderTotals {
  const advance = settings.payments.codAdvance;

  if (method === 'contra_entrega') {
    const subtotal = roundMoney(items.reduce((sum, i) => sum + codUnitPrice(i, settings) * i.quantity, 0));
    const discount = roundMoney(subtotal * (couponPercent / 100));
    const net = roundMoney(subtotal - discount);
    const shipping = items.length > 0 ? advance : 0;
    const total = roundMoney(net + shipping);
    return { subtotal, discount, shipping, shippingIncluded: false, total, payNow: shipping, payOnDelivery: net };
  }

  const subtotal = roundMoney(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const discount = roundMoney(subtotal * (couponPercent / 100));
  const net = roundMoney(subtotal - discount);
  const shipping = province ? getTransferShipping(settings, province) : settings.shipping.defaultRate;
  const total = roundMoney(net + shipping);
  return { subtotal, discount, shipping, shippingIncluded: false, total, payNow: total, payOnDelivery: 0 };
}
