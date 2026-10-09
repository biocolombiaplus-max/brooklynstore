import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, orderBy, query, limit, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Carrier, CartItem, Order, OrderCustomer, OrderInput, OrderStatus, PaymentMethod } from './types';
import { generateOrderNumber, stripUndefined } from './utils';
import { saveLocalOrder } from './localOrders';
export { getLastLocalOrder, getLocalOrder, notifyOrderByEmail, notifyOrderByPush } from './localOrders';

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
    guideUrl: data.guideUrl || undefined,
    loyaltyCode: data.loyaltyCode || undefined,
    guideType: data.guideType === 'pdf' ? 'pdf' : data.guideUrl ? 'image' : undefined,
    couponCode: data.couponCode || undefined,
    channel: data.channel === 'whatsapp' ? 'whatsapp' : undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toMillis() : Date.now(),
  };
}

// Registra el pedido en Firestore (si está configurado) y siempre deja una
// copia local. Si la base de datos falla, el pedido NO se pierde: se genera
// igual su número y el cliente lo confirma por WhatsApp.
export async function createOrder(
  input: OrderInput,
  { requireDatabase = false, orderNumber = generateOrderNumber() }: { requireDatabase?: boolean; orderNumber?: string } = {},
): Promise<{ id: string; orderNumber: string }> {
  let id = `local-${Date.now()}`;
  if (requireDatabase) {
    // Pedidos manuales del panel: ahí sí debe fallar si no se guardó.
    const ref = await addDoc(collection(db, COLLECTION), { ...stripUndefined(input), orderNumber, createdAt: serverTimestamp() });
    return { id: ref.id, orderNumber };
  }
  if (db) {
    try {
      // Si Firestore tarda más de 8 s (mala señal, base de datos caída...),
      // no se hace esperar al cliente: el pedido sigue por WhatsApp.
      const ref = await Promise.race([
        addDoc(collection(db, COLLECTION), {
          ...stripUndefined(input),
          orderNumber,
          createdAt: serverTimestamp(),
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), 8000)),
      ]);
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

export async function updateOrderShipping(
  id: string,
  shipping: { carrier?: Carrier; trackingNumber?: string },
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    carrier: shipping.carrier ?? '',
    trackingNumber: shipping.trackingNumber ?? '',
  });
}

// Guarda (o quita, con url vacía) la foto / PDF de la guía de un pedido.
export async function updateOrderGuide(id: string, guide: { url: string; type: 'image' | 'pdf' } | null): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { guideUrl: guide?.url ?? '', guideType: guide?.type ?? '' });
}
