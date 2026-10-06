import { collection, doc, getDoc, increment, limit, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import { formatPrice, WA_LINE } from './utils';
import type { CartItem, Visitor } from './types';

// Panel "Visitantes en vivo" y recuperación de carritos abandonados.

const COLLECTION = 'visitors';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app').replace(/\/$/, '');

function toVisitor(id: string, d: any): Visitor {
  const ms = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : 0);
  return {
    id,
    firstSeen: ms(d.firstSeen),
    lastSeen: ms(d.lastSeen),
    visits: d.visits ?? 1,
    pageviews: d.pageviews ?? 1,
    lastPath: d.lastPath ?? '/',
    landing: d.landing ?? '/',
    source: d.source || 'Directo',
    campaign: d.campaign ?? '',
    device: d.device ?? '',
    city: d.city ?? '',
    region: d.region ?? '',
    products: d.products ?? [],
    cart: d.cart ?? [],
    cartValue: d.cartValue ?? 0,
    stage: d.stage ?? 'visita',
    stageAt: ms(d.stageAt),
    name: d.name ?? '',
    phone: d.phone ?? '',
    orderNumber: d.orderNumber ?? '',
    recoveryAt: ms(d.recoveryAt) || undefined,
    recoveryCount: d.recoveryCount ?? 0,
  };
}

// Visitantes de los últimos días, en tiempo real.
export function subscribeVisitors(days: number, onData: (list: Visitor[]) => void, onError: (e: Error) => void): () => void {
  const since = Timestamp.fromMillis(Date.now() - days * 24 * 60 * 60 * 1000);
  const q = query(collection(db, COLLECTION), where('lastSeen', '>=', since), orderBy('lastSeen', 'desc'), limit(500));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => toVisitor(d.id, d.data()))),
    (err) => onError(err),
  );
}

export async function markRecoverySent(id: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), { recoveryAt: Date.now(), recoveryCount: increment(1) });
}

export async function getRecoverableCart(id: string): Promise<CartItem[]> {
  if (!db) return [];
  const snap = await getDoc(doc(db, COLLECTION, id));
  const cart = (snap.data()?.cart ?? []) as CartItem[];
  return cart.filter((i) => i.productId && i.title).map((i) => ({ ...i, quantity: i.quantity || 1 }));
}

export function recoveryUrl(id: string): string {
  return `${SITE_URL}/carrito?recuperar=${id}&utm_source=whatsapp&utm_campaign=recuperar-carrito`;
}

// Mensaje premium para quien dejó zapatos en el carrito.
export function buildRecoveryMessage(v: Visitor, opts: { codAdvance: number; deliveryTime: string; exchangeHours: number }): string {
  const firstName = v.name.split(' ')[0] || '';
  const lines = v.cart
    .slice(0, 4)
    .map((i) => `▸ *${i.title}*\n   Talla ${i.size}${i.color ? ` · ${i.color}` : ''}${i.quantity > 1 ? ` · x${i.quantity}` : ''}`)
    .join('\n');
  return `¡Hola${firstName ? ` ${firstName}` : ''}! Te escribe Brooklyn Store.

Vimos que dejaste esto en tu carrito:
${lines}

Te lo tenemos *separado por hoy*, pero esa talla se agota rápido.

*¿Por qué comprar con nosotros?*
${WA_LINE}
• Pagas solo *${formatPrice(opts.codAdvance)}* hoy y el resto al recibir
• Envío a todo Ecuador con Servientrega (${opts.deliveryTime})
• Cambio de talla en ${opts.exchangeHours} horas
${WA_LINE}

Tu carrito ya está listo, termina tu compra aquí:
${recoveryUrl(v.id)}

¿Alguna duda con la talla o el pago? Respóndeme por aquí y te ayudo al instante.`;
}
