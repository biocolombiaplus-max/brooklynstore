import type { BankAccount, Order, OrderCustomer, PaymentMethod } from './types';

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
// Algunos celulares, WhatsApp Business y WhatsApp Web convierten los emojis
// que viajan dentro de un link en "�". Por eso todo mensaje sale limpio:
// sin emojis, con el formato propio de WhatsApp (*negrita*, _cursiva_),
// separadores y viñetas que siempre se ven bien.
export function waSafeText(message: string): string {
  return message
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\u200D\uFE0E\uFE0F\u20E3]/gu, '')
    .replace(/\p{Extended_Pictographic}[ \t]?/gu, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]{2,}/g, (m, i) => (i === 0 ? m : ' ')).replace(/^ (?=\S)/, '').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function whatsappLinkTo(phone: string, message: string, countryCode?: string): string {
  const cc = (countryCode || WA_COUNTRY).replace(/\D/g, '');
  const digits = (phone || '').replace(/\D/g, '').replace(/^0+/, '');
  const text = encodeURIComponent(waSafeText(message));
  if (!digits) return `https://wa.me/?text=${text}`;
  const fullNumber = cc && !digits.startsWith(cc) ? `${cc}${digits}` : digits;
  return `https://wa.me/${fullNumber}?text=${text}`;
}

// Separador para los mensajes de WhatsApp.
export const WA_LINE = '━━━━━━━━━━━━━━━';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app').replace(/\/$/, '');

// Link a la "foto del pedido": WhatsApp muestra la foto del modelo en el
// color elegido como vista previa del mensaje.
export function orderPhotoUrl(item: { slug?: string; color?: string; size?: string; quantity?: number }): string | null {
  if (!item.slug) return null;
  const params = new URLSearchParams();
  if (item.color) params.set('c', item.color);
  if (item.size) params.set('t', item.size);
  if (item.quantity && item.quantity > 1) params.set('n', String(item.quantity));
  const qs = params.toString();
  return `${SITE_URL}/foto/${encodeURIComponent(item.slug)}${qs ? `?${qs}` : ''}`;
}

function photoLine(item: { slug?: string; color?: string; size?: string; quantity?: number }): string {
  const url = orderPhotoUrl(item);
  return url ? `\n   Foto: ${url}` : '';
}

export function buildCartWhatsAppMessage(
  items: { title: string; slug?: string; size: string; sizeUs?: string; color: string; quantity: number; price?: number }[],
): string {
  const lines = items
    .map(
      (i) =>
        `▸ *${i.title}*\n   Talla ${i.size}${i.sizeUs ? ` EC (US ${i.sizeUs})` : ''}${i.color ? ` · ${i.color}` : ''} · x${i.quantity}${
          i.price !== undefined ? `\n   Valor: ${formatPrice(i.price * i.quantity)}` : ''
        }${photoLine(i)}`,
    )
    .join('\n\n');
  const subtotal = items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  return `Hola Brooklyn Store, quiero terminar mi compra.

*MI CARRITO*
${WA_LINE}
${lines}${subtotal > 0 ? `\n${WA_LINE}\n*Subtotal: ${formatPrice(subtotal)}*` : ''}

¿Me ayudan a confirmar el pedido?
Forma de pago: (transferencia / contra entrega)`;
}

export function paymentMethodLabel(method: PaymentMethod): string {
  return method === 'contra_entrega' ? '💵 Pago contra entrega' : '🏦 Transferencia / depósito Banco Pichincha';
}

// Resumen completo del pedido para WhatsApp — tipo factura, claro y listo
// para enviar. Deja explícito cuánto se paga ahora y cuánto al recibir, que
// es lo que más confianza genera (y evita malentendidos con el courier).
export function buildOrderWhatsAppMessage(order: {
  orderNumber: string;
  items: { title: string; slug?: string; size: string; sizeUs?: string; color: string; quantity: number; price: number }[];
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
  payNow: number;
  payOnDelivery: number;
  paymentMethod: PaymentMethod;
  couponCode?: string;
  customer: OrderCustomer;
}, opts: { paid?: boolean } = {}): string {
  const cod = order.paymentMethod === 'contra_entrega';
  const itemsList = order.items
    .map(
      (i) =>
        `▸ *${i.title}*\n   Talla ${i.size}${i.sizeUs ? ` EC (US ${i.sizeUs})` : ''}${i.color ? ` · ${i.color}` : ''} · x${i.quantity}\n   Valor: ${formatPrice(
          i.price * i.quantity,
        )}${photoLine(i)}`,
    )
    .join('\n\n');

  const paymentBlock = cod
    ? `*FORMA DE PAGO*\nPago contra entrega\n• Hoy, para garantizar el envío: *${formatPrice(order.payNow)}*\n   (transferencia o depósito Banco Pichincha)\n• Al recibir, en efectivo: *${formatPrice(order.payOnDelivery)}*`
    : `*FORMA DE PAGO*\nTransferencia o depósito Banco Pichincha\n• Total a pagar: *${formatPrice(order.payNow)}*`;

  const c = order.customer;
  const delivery = [
    `Nombre: ${c.name}`,
    c.cedula ? `C.I.: ${c.cedula}` : '',
    `Celular: ${c.phone}`,
    `Dirección: ${c.address}`,
    c.reference ? `Referencia: ${c.reference}` : '',
    `Ciudad: ${c.city}, ${c.province}`,
    c.locationUrl ? `Ubicación: ${c.locationUrl}` : '',
    c.note ? `Nota: ${c.note}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const closing = opts.paid
    ? `✓ *Pago realizado:* ${formatPrice(order.payNow)}${cod ? ' (envío)' : ''} en Banco Pichincha.\nAdjunto la foto del comprobante. Quedo atento/a a mi guía de Servientrega. ¡Gracias!`
    : cod
    ? `Por favor confírmenme el pedido para enviar el comprobante de los ${formatPrice(order.payNow)} que garantizan el envío. ¡Gracias!`
    : 'Por favor confírmenme el pedido. En seguida les envío la foto del comprobante. ¡Gracias!';

  return `*${opts.paid ? 'PEDIDO PAGADO' : 'NUEVO PEDIDO'} · ${order.orderNumber}*
_Brooklyn Store_
${WA_LINE}

*PRODUCTOS*
${itemsList}

${WA_LINE}
Subtotal: ${formatPrice(order.subtotal)}${
    order.discount ? `\nDescuento${order.couponCode ? ` (${order.couponCode})` : ''}: -${formatPrice(order.discount)}` : ''
  }
Envío Servientrega: ${order.shipping === 0 ? 'Sin costo' : formatPrice(order.shipping)}
*TOTAL: ${formatPrice(order.total)}*
${WA_LINE}

${paymentBlock}

*DATOS DE ENTREGA*
${delivery}

${closing}`;
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

// Datos de una cuenta en texto, listos para copiar o mandar por WhatsApp.
export function bankAccountText(account: BankAccount, amount?: number): string {
  return [
    `${account.bank}`,
    `${account.type}`,
    `N.º ${account.number}`,
    `Titular: ${account.holder}`,
    account.idNumber ? `Cédula/RUC: ${account.idNumber}` : '',
    amount !== undefined ? `Valor: ${formatPrice(amount)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// Mensaje del cliente a la tienda cuando ya pagó: la foto la adjunta él.
export function buildReceiptMessage(order: Order): string {
  const cod = order.paymentMethod === 'contra_entrega';
  return `*COMPROBANTE DE PAGO*
${WA_LINE}
Pedido: *${order.orderNumber}*
Nombre: ${order.customer.name}
Valor pagado: *${formatPrice(order.payNow)}*${cod ? ' (envío; el resto lo pago al recibir)' : ''}
Banco: Pichincha
${WA_LINE}
Adjunto la foto del comprobante. Quedo atento/a a la guía de Servientrega. ¡Gracias!`;
}

// Mensaje de la tienda al cliente con los datos para pagar (desde el panel).
export function buildPaymentDataMessage(order: Order, accounts: BankAccount[]): string {
  const firstName = order.customer.name.split(' ')[0];
  const cod = order.paymentMethod === 'contra_entrega';
  return `¡Hola ${firstName}! Gracias por tu pedido *${order.orderNumber}* en Brooklyn Store.

${cod ? `Para garantizar tu envío, transfiere o deposita *${formatPrice(order.payNow)}*. Los *${formatPrice(order.payOnDelivery)}* restantes los pagas en efectivo al recibir.` : `Para despachar tu pedido, transfiere o deposita *${formatPrice(order.payNow)}*.`}

*DATOS PARA EL PAGO*
${WA_LINE}
${accounts.map((a) => bankAccountText(a)).join(`\n${WA_LINE}\n`)}
${WA_LINE}

Cuando pagues, envíanos por aquí la foto del comprobante y despachamos ese mismo día con Servientrega.`;
}

// Link a la página de la guía de envío (foto o PDF) de un pedido.
export function guidePageUrl(order: { orderNumber: string; trackingNumber?: string; guideUrl?: string; guideType?: 'image' | 'pdf' }): string | null {
  if (!order.guideUrl && !order.trackingNumber) return null;
  const params = new URLSearchParams();
  if (order.guideUrl) params.set('f', order.guideUrl);
  if (order.guideType === 'pdf') params.set('t', 'pdf');
  params.set('n', order.orderNumber);
  if (order.trackingNumber) params.set('g', order.trackingNumber);
  return `${SITE_URL}/guia?${params.toString()}`;
}

// Mensaje al cliente con los datos del envío y su guía.
export function buildShippedMessage(order: Order, storeName: string): string {
  const firstName = order.customer.name.split(' ')[0];
  const link = guidePageUrl(order);
  const lines = [
    `Transportadora: *${order.carrier || 'Servientrega'}*`,
    order.trackingNumber ? `Número de guía: *${order.trackingNumber}*` : '',
    `Destino: ${order.customer.city}, ${order.customer.province}`,
    order.paymentMethod === 'contra_entrega' ? `Al recibir pagas: *${formatPrice(order.payOnDelivery)}* en efectivo` : '',
  ].filter(Boolean);
  return `¡Hola ${firstName}! Tu pedido *${order.orderNumber}* de ${storeName} ya va en camino.

*DATOS DEL ENVÍO*
${WA_LINE}
${lines.join('\n')}
${WA_LINE}
${link ? `\n*Tu guía${order.guideType === 'pdf' ? ' (PDF)' : ''}:*\n${link}\n` : ''}
Con el número de guía puedes rastrear tu paquete en servientrega.com.ec. Cualquier novedad, escríbenos por aquí. ¡Gracias por tu compra!`;
}
