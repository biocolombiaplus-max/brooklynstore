import { formatPrice } from './utils';
import type { CartItem, Order, OrderCustomer, PaymentMethod } from './types';

// Pedido guardado en el celular del cliente y avisos a la tienda (correo y
// push). Sin Firebase: la tienda lo usa sin cargar la base de datos.

const LAST_ORDER_KEY = 'brooklyn-last-order';

// Guarda una copia del pedido en el navegador del cliente: la página de
// confirmación la lee de aquí (los pedidos en Firestore solo los puede leer
// el administrador) y así también funciona aunque Firebase no esté
// configurado todavía.
export function saveLocalOrder(order: Order): void {
  try {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Almacenamiento no disponible — la confirmación igual se hace por WhatsApp.
  }
}

// Último pedido hecho desde este navegador (para "Rastrear pedido").
export function getLastLocalOrder(): Order | null {
  try {
    const raw = localStorage.getItem(LAST_ORDER_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

export function getLocalOrder(id: string): Order | null {
  try {
    const raw = localStorage.getItem(LAST_ORDER_KEY);
    if (!raw) return null;
    const order = JSON.parse(raw) as Order;
    return order.id === id ? order : null;
  } catch {
    return null;
  }
}

// Avisa por correo a la tienda que llegó un pedido nuevo — igual que la
// notificación automática de Shopify. Nunca debe romper el checkout: si no
// hay correo configurado o el envío falla, simplemente no pasa nada.
export function notifyOrderByEmail(payload: {
  to: string;
  storeName: string;
  accentColor?: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payNow: number;
  payOnDelivery: number;
  paymentMethod: PaymentMethod;
  customer: OrderCustomer;
}): void {
  if (!payload.to) return;
  fetch('/api/notify-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// Notificación push al celular de la administradora — llega como aviso del
// sistema (con sonido y vibración) aunque la tienda no esté abierta, igual
// que la app de Shopify. Si nadie activó las notificaciones o faltan las
// llaves VAPID en el servidor, no pasa nada (el checkout sigue normal).
export function notifyOrderByPush(payload: {
  orderNumber: string;
  total: number;
  customerName: string;
  city?: string;
  pairs?: number;
  method?: 'transferencia' | 'contra_entrega';
}): void {
  const details = [
    payload.customerName.split(' ').slice(0, 2).join(' '),
    payload.city,
    payload.pairs ? `${payload.pairs} ${payload.pairs === 1 ? 'par' : 'pares'}` : '',
    payload.method ? (payload.method === 'contra_entrega' ? 'Contra entrega' : 'Transferencia') : '',
  ].filter(Boolean);
  fetch('/api/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: `🛍️ Nuevo pedido · ${formatPrice(payload.total)}`,
      bodyText: `${details.join(' · ')}\n${payload.orderNumber} — toca para verlo`,
      url: '/admin/pedidos',
    }),
  }).catch(() => {});
}

