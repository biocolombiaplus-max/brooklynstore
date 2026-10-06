import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { WA_LINE } from './utils';
import { getProductById, updateProduct } from './products';
import type { LoyaltyRecord, LoyaltyReview, Order, ProductReview } from './types';

// Fidelización: al entregar un pedido se crea un registro con un código
// único que sirve a la vez como link de reseña (/resena/CODIGO) y como
// cupón de 10% OFF por 15 días pagando por transferencia.

const COLLECTION = 'loyalty';
export const LOYALTY_PERCENT = 10;
export const LOYALTY_DAYS = 15;
// Día del recordatorio (antes de que venza el cupón).
export const REMINDER_DAY = 14;
const DAY = 24 * 60 * 60 * 1000;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app').replace(/\/$/, '');

export function reviewUrl(code: string): string {
  return `${SITE_URL}/resena/${encodeURIComponent(code)}`;
}

export function couponCatalogUrl(code: string): string {
  return `${SITE_URL}/catalogo?cupon=${encodeURIComponent(code)}`;
}

function randomPart(length: number): string {
  // Sin letras/números que se confundan (O/0, I/1).
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => alphabet[v % alphabet.length]).join('');
}

export function generateLoyaltyCode(customerName: string): string {
  const name = customerName
    .split(' ')[0]
    .normalize('NFD')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 6);
  return `GRACIAS-${name || 'BS'}${randomPart(5)}`;
}

function toRecord(id: string, data: Record<string, unknown>): LoyaltyRecord {
  const ms = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : undefined);
  return {
    ...(data as unknown as LoyaltyRecord),
    code: id,
    couponExpiresAt: ms(data.couponExpiresAt) ?? 0,
    reviewSubmittedAt: ms(data.reviewSubmittedAt),
    reminderSentAt: ms(data.reminderSentAt),
    createdAt: ms(data.createdAt) ?? Date.now(),
    couponUsed: !!data.couponUsed,
    reviewStatus: (data.reviewStatus as LoyaltyRecord['reviewStatus']) ?? 'pendiente',
  };
}

export async function getLoyalty(code: string): Promise<LoyaltyRecord | null> {
  if (!db || !code) return null;
  const snap = await getDoc(doc(db, COLLECTION, code.trim().toUpperCase()));
  return snap.exists() ? toRecord(snap.id, snap.data()) : null;
}

export async function listLoyalty(): Promise<LoyaltyRecord[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => toRecord(d.id, d.data())).sort((a, b) => b.createdAt - a.createdAt);
}

// Crea (una sola vez por pedido) el registro de fidelización y lo enlaza al pedido.
export async function ensureLoyaltyForOrder(order: Order): Promise<LoyaltyRecord> {
  if (order.loyaltyCode) {
    const existing = await getLoyalty(order.loyaltyCode);
    if (existing) return existing;
  }
  const code = generateLoyaltyCode(order.customer.name);
  const record: Omit<LoyaltyRecord, 'code'> = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name.split(' ')[0],
    phone: order.customer.phone,
    city: order.customer.city,
    items: order.items.map((i) => ({
      productId: i.productId,
      slug: i.slug,
      title: i.title,
      image: i.image || '',
      size: i.size,
      color: i.color || '',
    })),
    couponPercent: LOYALTY_PERCENT,
    couponMethod: 'transferencia',
    couponExpiresAt: Date.now() + LOYALTY_DAYS * DAY,
    couponUsed: false,
    reviewStatus: 'pendiente',
    createdAt: Date.now(),
  };
  await setDoc(doc(db, COLLECTION, code), record);
  await updateDoc(doc(db, 'orders', order.id), { loyaltyCode: code });
  return { ...record, code };
}

// El cliente envía sus reseñas desde el link (sin iniciar sesión).
export async function submitLoyaltyReviews(code: string, reviews: LoyaltyReview[]): Promise<void> {
  await updateDoc(doc(db, COLLECTION, code), {
    reviews,
    reviewStatus: 'enviada',
    reviewSubmittedAt: serverTimestamp(),
  });
}

// Marca el cupón como usado al hacer un pedido con él.
export async function markLoyaltyCouponUsed(code: string, orderNumber: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, code), {
    couponUsed: true,
    couponUsedOrder: orderNumber,
    couponUsedAt: serverTimestamp(),
  });
}

export async function markReminderSent(code: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, code), { reminderSentAt: Date.now() });
}

export async function setReviewStatus(code: string, status: LoyaltyRecord['reviewStatus']): Promise<void> {
  await updateDoc(doc(db, COLLECTION, code), { reviewStatus: status });
}

// Publica las reseñas en cada producto como "compra verificada".
export async function approveLoyaltyReviews(record: LoyaltyRecord): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  for (const r of record.reviews ?? []) {
    if (!r.rating) continue;
    const product = await getProductById(r.productId);
    if (!product) continue;
    const review: ProductReview = {
      name: record.customerName,
      city: record.city,
      rating: r.rating,
      text: r.text.trim(),
      date,
      verified: true,
      ...(r.fit ? { fit: r.fit } : {}),
    };
    const reviews = [review, ...(product.reviews ?? [])];
    await updateProduct(product.id, { reviews, reviewsCount: (product.reviewsCount ?? 0) + 1 });
  }
  await setReviewStatus(record.code, 'aprobada');
}

export function daysLeft(record: LoyaltyRecord): number {
  return Math.ceil((record.couponExpiresAt - Date.now()) / DAY);
}

// ¿Toca enviar el recordatorio? (desde el día 14, cupón sin usar ni vencido)
export function reminderDue(record: LoyaltyRecord): boolean {
  const left = daysLeft(record);
  return !record.couponUsed && left > 0 && left <= LOYALTY_DAYS - REMINDER_DAY + 1 && !record.reminderSentAt;
}

export function expiryLabel(record: LoyaltyRecord): string {
  return new Date(record.couponExpiresAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'long' });
}

// Mensaje al entregar: pedir reseña y regalar el 10% OFF.
export function buildReviewRequestMessage(record: LoyaltyRecord, storeName: string): string {
  const product = record.items[0]?.title ?? 'tus zapatos';
  return `¡Hola ${record.customerName}! Qué gusto que ya tengas tus *${product}*${record.items.length > 1 ? ' y demás' : ''}.

*¿Nos regalas tu opinión?*
Te toma 30 segundos y nos ayuda muchísimo:
${reviewUrl(record.code)}

*TU REGALO: ${record.couponPercent}% OFF*
${WA_LINE}
Código: *${record.code}*
Válido hasta: *${expiryLabel(record)}* (${LOYALTY_DAYS} días)
Aplica pagando por transferencia o depósito.
${WA_LINE}

Mira el catálogo con tu descuento ya activado:
${couponCatalogUrl(record.code)}

Gracias por confiar en ${storeName}.`;
}

// Recordatorio del día 14.
export function buildReminderMessage(record: LoyaltyRecord): string {
  const left = Math.max(1, daysLeft(record));
  return `¡Hola ${record.customerName}! Te recordamos que tu *${record.couponPercent}% OFF* vence ${
    left <= 1 ? '*mañana*' : `en *${left} días*`
  } (${expiryLabel(record)}).

Código: *${record.code}*
Aplica pagando por transferencia o depósito.

Aprovecha y estrena otra vez:
${couponCatalogUrl(record.code)}${
    record.reviewStatus === 'pendiente' ? `\n\nY si aún no nos dejas tu reseña, aquí está el link:\n${reviewUrl(record.code)}` : ''
  }`;
}
