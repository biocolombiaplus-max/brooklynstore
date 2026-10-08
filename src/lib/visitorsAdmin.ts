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

// ——— Secuencia de recuperación de carrito (estándar de Shopify/Klaviyo) ———
// 1) ~1 hora después: recordatorio amable y ayuda con la talla.
// 2) ~24 horas después del 1.º: confianza (pago al recibir, cambios, envío).
// 3) ~24 horas después del 2.º: última oportunidad con 5% OFF por 24 h.
// Cada paso tiene varias versiones: cada cliente recibe un texto distinto.

const HOUR = 60 * 60 * 1000;
export const RECOVERY_COUPON = 'VUELVE5';
export const RECOVERY_STEPS = [
  { step: 1, label: 'Recordatorio y ayuda', wait: 1 * HOUR, when: '1 h después' },
  { step: 2, label: 'Confianza y garantía', wait: 23 * HOUR, when: '1 día después' },
  { step: 3, label: 'Última oportunidad · 5% OFF', wait: 24 * HOUR, when: '2 días después' },
] as const;
const RECOVERY_MAX_AGE = 7 * 24 * HOUR;

export interface RecoveryStatus {
  sent: number; // mensajes ya enviados
  next: (typeof RECOVERY_STEPS)[number] | null; // siguiente paso (null = secuencia terminada)
  dueAt: number; // cuándo toca el siguiente
  due: boolean; // ¿toca enviarlo ya?
  expired: boolean; // más de 7 días: ya no se insiste
}

export function recoveryStatus(v: Visitor, now = Date.now()): RecoveryStatus {
  const sent = Math.min(3, v.recoveryCount ?? (v.recoveryAt ? 1 : 0));
  const expired = now - v.lastSeen > RECOVERY_MAX_AGE;
  const next = sent >= RECOVERY_STEPS.length ? null : RECOVERY_STEPS[sent];
  const base = sent === 0 ? v.lastSeen : v.recoveryAt || v.lastSeen;
  const dueAt = next ? base + next.wait : 0;
  return { sent, next, dueAt, due: !!next && !expired && now >= dueAt, expired };
}

function variantOf(id: string, step: number, count: number): number {
  let h = step * 31;
  for (const ch of id) h = (h * 33 + ch.charCodeAt(0)) >>> 0;
  return h % count;
}

function cartLines(v: Visitor): string {
  if (!v.cart.length) return v.products.slice(0, 3).map((p) => `▸ *${p.title}*`).join('\n');
  return v.cart
    .slice(0, 4)
    .map((i) => `▸ *${i.title}*\n   Talla ${i.size}${i.color ? ` · ${i.color}` : ''}${i.quantity > 1 ? ` · x${i.quantity}` : ''}`)
    .join('\n');
}

export function buildRecoveryStepMessage(
  v: Visitor,
  step: 1 | 2 | 3,
  opts: { codAdvance: number; deliveryTime: string; exchangeHours: number; storeName?: string },
): string {
  const name = v.name.split(' ')[0] || '';
  const hola = `¡Hola${name ? ` ${name}` : ''}!`;
  const store = opts.storeName || 'Brooklyn Store';
  const first = v.cart[0]?.title ?? v.products[0]?.title ?? 'tus zapatos';
  const lines = cartLines(v);
  const link = recoveryUrl(v.id) + (step === 3 ? `&cupon=${RECOVERY_COUPON}` : '');
  const cod = formatPrice(opts.codAdvance);

  const variants: Record<1 | 2 | 3, string[]> = {
    1: [
      `${hola} Te escribe ${store}.

Vimos que te gustaron estos zapatos:
${lines}

¿Te quedó alguna duda con la talla o el pago? Respóndeme por aquí y te ayudo en un minuto.

Tu carrito sigue guardado, termínalo aquí:
${link}`,
      `${hola} Soy de ${store}.

Te guardamos tu carrito con:
${lines}

Si no sabes qué talla pedir, mándame la talla que usas normalmente y te digo cuál te queda perfecta.

Para terminar tu compra en 1 minuto:
${link}`,
      `${hola} Gracias por visitar ${store}.

Dejaste tu *${first}* en el carrito. ¿Te ayudo a terminar el pedido?

Recuerda que puedes pagar solo *${cod}* hoy y el resto cuando lo recibas.

Tu carrito está listo aquí:
${link}`,
    ],
    2: [
      `${hola} Te escribo de ${store} por tus *${first}*.

Para que compres con total tranquilidad:
${WA_LINE}
• Pagas solo *${cod}* hoy y el resto *al recibir*
• Envío con Servientrega a todo Ecuador (${opts.deliveryTime})
• ¿No te quedó? Cambio de talla en ${opts.exchangeHours} horas
${WA_LINE}

Tu carrito sigue guardado:
${link}`,
      `${hola} Seguimos guardando tu pedido en ${store}:
${lines}

Muchos clientes nos preguntan si es seguro: por eso puedes *pagar al recibir*, adelantando solo ${cod} para el envío. Te llega con número de guía de Servientrega.

Retoma tu compra aquí:
${link}`,
      `${hola} ¿Sigues pensando en tus *${first}*?

En ${store} recibes tus zapatos en casa y los pagas al recibir (hoy solo ${cod}). Y si la talla no te queda, te lo cambiamos en ${opts.exchangeHours} horas.

Tu carrito te espera:
${link}`,
    ],
    3: [
      `${hola} Último aviso de ${store}: tu carrito vence hoy.

${lines}

Para que te animes, te regalamos *5% OFF* con el código *${RECOVERY_COUPON}* (válido 24 horas). Ya viene activado en este link:
${link}`,
      `${hola} No queremos que te quedes sin tus *${first}*: esa talla se está agotando.

Solo por hoy tienes *5% de descuento* con el código *${RECOVERY_COUPON}*. Entra aquí y ya se aplica solo:
${link}

Cualquier duda, respóndeme por aquí.`,
      `${hola} Te escribe ${store} por última vez sobre tu pedido.

Te dejamos un *5% OFF* exclusivo para que termines tu compra hoy (código *${RECOVERY_COUPON}*, 24 horas):
${link}

Pagas al recibir y te llega con Servientrega a todo Ecuador.`,
    ],
  };
  const list = variants[step];
  return list[variantOf(v.id, step, list.length)];
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
