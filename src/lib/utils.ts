import type { OrderCustomer, PaymentMethod } from './types';

// Determina qué foto mostrar para el color elegido: si el admin le asignó
// una foto específica a ese color, se usa esa. Si no, se muestra la foto
// principal del producto en vez de adivinar por posición — adivinar por
// orden de subida mostraba fotos de OTRO color cuando las fotos no se
// subieron en el mismo orden que los colores (ej: elegir "Negro" y que
// aparezca la foto café), que es peor que simplemente no cambiar la foto.
export function resolveColorImage(
  product: { colors: { name: string; image?: string }[]; images: string[] },
  colorName: string,
): string | undefined {
  const color = product.colors.find((c) => c.name === colorName);
  if (!color) return undefined;
  return color.image || product.images[0];
}

const PRICE_FORMAT = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const PRICE_FORMAT_INT = new Intl.NumberFormat('es-EC', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

// Precios en dólares (Ecuador): "$59" si es un valor redondo, "$59,99" si
// tiene centavos.
export function formatPrice(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? PRICE_FORMAT_INT.format(rounded) : PRICE_FORMAT.format(rounded);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const WA_COUNTRY = process.env.NEXT_PUBLIC_WHATSAPP_COUNTRY_CODE || '593';

/**
 * Construye un enlace wa.me válido a partir de un número escrito de cualquier
 * forma (con espacios, guiones, +, el 0 inicial de Ecuador "09...", con o sin
 * el código de país ya incluido). Si todavía no hay número configurado, abre
 * WhatsApp con el mensaje listo para que el cliente elija el contacto.
 */
export function whatsappLinkTo(phone: string, message: string, countryCode?: string): string {
  const cc = (countryCode || WA_COUNTRY).replace(/\D/g, '');
  const digits = (phone || '').replace(/\D/g, '').replace(/^0+/, '');
  if (!digits) return `https://wa.me/?text=${encodeURIComponent(message)}`;
  const fullNumber = cc && !digits.startsWith(cc) ? `${cc}${digits}` : digits;
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`;
}

export function buildCartWhatsAppMessage(items: { title: string; size: string; color: string; quantity: number }[]): string {
  const lines = items.map((i) => `• ${i.title} (talla ${i.size}${i.color ? `, ${i.color}` : ''}) x${i.quantity}`).join('\n');
  return `¡Hola Brooklyn Store! 👋 Quiero terminar mi compra:\n\n${lines}\n\n¿Me ayudan a confirmar el pedido?`;
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return method === 'contra_entrega' ? '💵 Pago contra entrega' : '🏦 Transferencia / depósito bancario';
}

// Resumen completo del pedido para WhatsApp — tipo factura, claro y listo
// para enviar. Deja explícito cuánto se paga ahora y cuánto al recibir, que
// es lo que más confianza genera (y evita malentendidos con el courier).
export function buildOrderWhatsAppMessage(order: {
  orderNumber: string;
  items: { title: string; size: string; color: string; quantity: number; price: number }[];
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
  payNow: number;
  payOnDelivery: number;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  customer: OrderCustomer;
}): string {
  const itemsList = order.items
    .map(
      (i) =>
        `• ${i.title}\n   Talla ${i.size}${i.color ? ` · ${i.color}` : ''} · x${i.quantity} — ${formatPrice(i.price * i.quantity)}`,
    )
    .join('\n');

  const paymentBlock =
    order.paymentMethod === 'contra_entrega'
      ? `💵 *Pago contra entrega*\n➡️ Adelanto del envío (transferencia/depósito): *${formatPrice(order.payNow)}*\n➡️ Pago al recibir en mi dirección: *${formatPrice(order.payOnDelivery)}*`
      : `🏦 *Transferencia / depósito bancario*\n➡️ Total a transferir: *${formatPrice(order.payNow)}*`;

  const c = order.customer;
  return `🛍️ *NUEVO PEDIDO — ${order.orderNumber}*
Brooklyn Store

📦 *Productos:*
${itemsList}

Subtotal: ${formatPrice(order.subtotal)}${
    order.discount ? `\nDescuento${order.couponCode ? ` (${order.couponCode})` : ''}: -${formatPrice(order.discount)}` : ''
  }
Envío: ${order.shipping === 0 ? 'GRATIS' : formatPrice(order.shipping)}
*TOTAL: ${formatPrice(order.total)}*

${paymentBlock}

📍 *Datos de entrega:*
👤 ${c.name}${c.cedula ? `\n🪪 C.I. ${c.cedula}` : ''}
📱 ${c.phone}
🏠 ${c.address}${c.reference ? `\n🧭 Referencia: ${c.reference}` : ''}
🏙️ ${c.city}, ${c.province}${c.locationUrl ? `\n🗺️ Ubicación: ${c.locationUrl}` : ''}${c.note ? `\n📝 Nota: ${c.note}` : ''}

${
    order.paymentMethod === 'contra_entrega'
      ? `Porfa, confírmenme el pedido para enviar el comprobante de los ${formatPrice(order.payNow)} del envío. ¡Gracias! 🙌`
      : 'Porfa, confírmenme el pedido. Ya mismo les envío la foto del comprobante. ¡Gracias! 🙌'
  }`;
}

export function generateOrderNumber(): string {
  const date = new Date();
  const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(
    date.getDate(),
  ).padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BS-${stamp}-${random}`;
}

export function classNames(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

// Firestore rechaza addDoc()/updateDoc() si algún campo (a cualquier
// profundidad, incluso dentro de arreglos como `colors`) queda en
// `undefined` — hay que quitar esas llaves del todo antes de guardar.
// Aplícalo solo sobre datos planos (no sobre el objeto ya armado con
// serverTimestamp(), que es un valor especial de Firestore y no debe
// reconstruirse como objeto plano).
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) result[key] = stripUndefined(val);
    }
    return result as T;
  }
  return value;
}

export function hexToRgbChannels(hex: string): string {
  const clean = hex.replace('#', '').trim();
  const normalized = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const bigint = parseInt(normalized, 16);
  if (normalized.length !== 6 || Number.isNaN(bigint)) return '0 0 0';
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r} ${g} ${b}`;
}
