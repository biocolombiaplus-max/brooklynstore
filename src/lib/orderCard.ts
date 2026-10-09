// Tarjeta del pedido para WhatsApp: un link con los productos elegidos
// (modelo, color, talla, cantidad), la forma de pago y el total. Su vista
// previa es una imagen premium con las fotos reales de los zapatos (ver
// /api/og/pedido), así el cliente y el asesor ven exactamente lo pedido.

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app').replace(/\/$/, '');

export interface OrderCardItem {
  slug: string;
  color: string;
  size: string;
  quantity: number;
}

export interface OrderCardData {
  orderNumber: string;
  items: OrderCardItem[];
  cod: boolean;
  total: number;
}

const clean = (v: string) => v.replace(/[~|]/g, ' ').trim();

export function orderCardQuery(data: Omit<OrderCardData, 'orderNumber'>): string {
  const params = new URLSearchParams();
  params.set('i', data.items.map((i) => [clean(i.slug), clean(i.color), clean(i.size), String(i.quantity || 1)].join('~')).join('|'));
  params.set('pm', data.cod ? 'c' : 't');
  params.set('tot', String(Math.round(data.total * 100) / 100));
  return params.toString();
}

export function orderCardUrl(data: OrderCardData): string {
  return `${SITE_URL}/pedido-web/${encodeURIComponent(data.orderNumber)}?${orderCardQuery(data)}`;
}

export function parseOrderCard(orderNumber: string, params: { i?: string; pm?: string; tot?: string }): OrderCardData {
  const items = (params.i ?? '')
    .split('|')
    .map((raw) => {
      const [slug = '', color = '', size = '', qty = '1'] = raw.split('~');
      return { slug: slug.trim(), color: color.trim(), size: size.trim(), quantity: Math.max(1, Math.min(20, Number(qty) || 1)) };
    })
    .filter((i) => /^[a-z0-9-]{1,120}$/i.test(i.slug))
    .slice(0, 8);
  return {
    orderNumber: decodeURIComponent(orderNumber).slice(0, 40),
    items,
    cod: params.pm === 'c',
    total: Math.max(0, Number(params.tot) || 0),
  };
}
