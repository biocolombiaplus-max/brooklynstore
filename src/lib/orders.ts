import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Carrier, CartItem, Order, OrderCustomer, OrderInput, OrderStatus, PaymentMethod } from './types';
import { formatPrice, generateOrderNumber, stripUndefined } from './utils';

const COLLECTION = 'orders';

function toOrder(id: string, data: any): Order {
  return {
    id,
    orderNumber: data.orderNumber,
    items: data.items ?? [],
    subtotal: data.subtotal ?? 0,
    discount: data.discount ?? 0,
    shipping: data.shipping ?? 0,
    total: data.total ?? 0,
    payNow: data.payNow ?? data.total ?? 0,
    payOnDelivery: data.payOnDelivery ?? 0,
    customer: data.customer,
    paymentMethod: data.paymentMethod,
    status: data.status ?? 'pendiente',
    carrier: data.carrier || undefined,
    trackingNumber: data.trackingNumber || undefined,
    couponCode: data.couponCode || undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
  };
}

const LAST_ORDER_KEY = 'brooklyn-last-order';

// Guarda una copia del pedido en el navegador del cliente: la página de
// confirmación la lee de aquí (los pedidos en Firestore solo los puede leer
// el administrador) y así también funciona aunque Firebase no esté
// configurado todavía.
function saveLocalOrder(order: Order): void {
  try {
    localStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
  } catch {
    // Almacenamiento no disponible — la confirmación igual se hace por WhatsApp.
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

// Registra el pedido en Firestore (si está configurado) y siempre deja una
// copia local. Si la base de datos falla, el pedido NO se pierde: se genera
// igual su número y el cliente lo confirma por WhatsApp.
export async function createOrder(
  input: OrderInput,
  { requireDatabase = false }: { requireDatabase?: boolean } = {},
): Promise<{ id: string; orderNumber: string }> {
  const orderNumber = generateOrderNumber();
  let id = `local-${Date.now()}`;
  if (requireDatabase) {
    // Pedidos manuales del panel: ahí sí debe fallar si no se guardó.
    const ref = await addDoc(collection(db, COLLECTION), { ...stripUndefined(input), orderNumber, createdAt: serverTimestamp() });
    return { id: ref.id, orderNumber };
  }
  if (db) {
    try {
      const ref = await addDoc(collection(db, COLLECTION), {
        ...stripUndefined(input),
        orderNumber,
        createdAt: serverTimestamp(),
      });
      id = ref.id;
    } catch (error) {
      console.error('[Pedidos] No se pudo guardar en Firestore, se confirma solo por WhatsApp.', error);
    }
  }
  saveLocalOrder({ ...input, id, orderNumber, createdAt: Date.now() });
  return { id, orderNumber };
}

export async function getOrderById(id: string): Promise<Order | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toOrder(snap.id, snap.data());
}

export async function getAllOrders(): Promise<Order[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => toOrder(d.id, d.data()));
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { status });
}

export async function deleteOrder(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

// Escucha en vivo los pedidos nuevos que van llegando mientras el admin
// tiene el panel abierto (para la campanita de aviso) — ignora la primera
// tanda de resultados (los pedidos ya existentes) y solo notifica los que
// se crean después de empezar a escuchar.
export function subscribeToNewOrders(onNewOrder: (order: Order) => void): () => void {
  const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(15));
  let isFirstSnapshot = true;
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          onNewOrder(toOrder(change.doc.id, change.doc.data()));
        }
      });
    },
    () => {},
  );
  return unsubscribe;
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
export function notifyOrderByPush(payload: { orderNumber: string; total: number; customerName: string }): void {
  fetch('/api/send-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '🎉 ¡Nuevo pedido!',
      bodyText: `${payload.orderNumber} · ${formatPrice(payload.total)} · ${payload.customerName}`,
      url: '/admin/pedidos',
    }),
  }).catch(() => {});
}

export async function updateOrderShipping(
  id: string,
  shipping: { carrier?: Carrier; trackingNumber?: string },
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    carrier: shipping.carrier ?? '',
    trackingNumber: shipping.trackingNumber ?? '',
  });
}
