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
  // true cuando el envío ya está incluido en el precio contra entrega.
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

// Precio unitario pagando contra entrega: el "precio contra entrega" del
// producto si lo tiene (ya incluye el envío), o el precio normal.
export function codUnitPrice(item: { price: number; codPrice?: number | null }, settings?: SiteSettings): number {
  if (item.codPrice && item.codPrice > 0) return item.codPrice;
  const general = settings?.payments.codUnitPrice ?? 0;
  return general > 0 ? general : item.price;
}

// ¿El precio contra entrega de este producto ya incluye el envío?
export function codIncludesShipping(item: { codPrice?: number | null }, settings: SiteSettings): boolean {
  return (!!item.codPrice && item.codPrice > 0) || (settings.payments.codUnitPrice ?? 0) > 0;
}

/**
 * Único lugar donde se calcula cuánto paga el cliente, para que el carrito,
 * la compra rápida, el checkout y el mensaje de WhatsApp siempre coincidan.
 *
 * - Transferencia/depósito: paga todo por adelantado (productos + envío de
 *   su provincia, gratis por defecto).
 * - Contra entrega: se usa el precio contra entrega de cada producto (que ya
 *   incluye el envío); si algún producto no lo tiene, se suma el envío
 *   (codAdvance) una vez. Hoy adelanta solo codAdvance ($5) y el resto lo
 *   paga en efectivo al recibir.
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
    const shippingIncluded = items.length > 0 && items.every((i) => codIncludesShipping(i, settings));
    const shipping = shippingIncluded ? 0 : advance;
    const total = roundMoney(net + shipping);
    const payNow = Math.min(advance, total);
    return { subtotal, discount, shipping, shippingIncluded, total, payNow, payOnDelivery: roundMoney(total - payNow) };
  }

  const subtotal = roundMoney(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const discount = roundMoney(subtotal * (couponPercent / 100));
  const net = roundMoney(subtotal - discount);
  const shipping = province ? getTransferShipping(settings, province) : settings.shipping.defaultRate;
  const total = roundMoney(net + shipping);
  return { subtotal, discount, shipping, shippingIncluded: false, total, payNow: total, payOnDelivery: 0 };
}
