'use client';

import { trackPixel, adTracking } from './pixel';
import { trackVisitorCheckoutItems, visitorContact } from './visitor';
import { codUnitPrice, computeOrderTotals } from './shipping';
import { couponPercentFor, getActiveCoupon } from './coupon';
import { buildOrderWhatsAppMessage, generateOrderNumber, whatsappLinkTo } from './utils';
import type { CartItem, PaymentMethod, SiteSettings } from './types';

// Pedido directo a WhatsApp, sin formulario: el cliente toca el botón y se
// abre el chat con su pedido (fotos, talla, color, forma de pago y total).
// Los datos de envío los da en el chat. El pedido queda en el panel como
// "Por cerrar" para marcarlo cuando se cierre la venta.
export function sendOrderToWhatsApp(items: CartItem[], method: PaymentMethod, settings: SiteSettings): void {
  if (!items.length) return;
  const orderNumber = generateOrderNumber();
  const coupon = getActiveCoupon();
  const percent = couponPercentFor(coupon, method);
  const totals = computeOrderTotals(settings, items, method, '', percent);
  const orderItems = method === 'contra_entrega' ? items.map((i) => ({ ...i, price: codUnitPrice(i, settings) })) : items;
  const order = {
    items: orderItems,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    payNow: totals.payNow,
    payOnDelivery: totals.payOnDelivery,
    // Si el cliente ya dejó su nombre y celular antes en este celular, el
    // pedido queda con ellos (así se le puede escribir desde el panel).
    customer: { ...visitorContact(), province: '', city: '', address: '' },
    paymentMethod: method,
    status: 'pendiente' as const,
    couponCode: percent > 0 ? coupon?.code : undefined,
    channel: 'whatsapp' as const,
    tracking: adTracking(),
  };

  // Se abre dentro del mismo toque (si no, el celular lo bloquea).
  const url = whatsappLinkTo(settings.whatsappNumber, buildOrderWhatsAppMessage({ ...order, orderNumber }, { request: true }), settings.whatsappCountryCode);
  const opened = !!window.open(url, '_blank');

  // Registro en el panel (en segundo plano: nunca frena al cliente).
  import('./orders').then(({ createOrder }) => createOrder(order, { orderNumber })).catch(() => {});
  trackVisitorCheckoutItems(items);
  trackPixel('InitiateCheckout', {
    content_ids: items.map((i) => i.metaId || i.productId),
    content_type: 'product',
    num_items: items.reduce((n, i) => n + i.quantity, 0),
    value: totals.total,
    currency: 'USD',
  });
  trackPixel('Contact', { content_name: `Pedido ${orderNumber}` });

  // Navegador interno (Facebook/Instagram) que bloquea ventanas nuevas: se
  // abre en la misma pestaña.
  if (!opened) setTimeout(() => (window.location.href = url), 350);
}
