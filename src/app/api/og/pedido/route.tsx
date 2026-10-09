import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { formatPrice } from '@/lib/utils';
import { parseOrderCard } from '@/lib/orderCard';
import { resolveOrderCard } from '@/lib/orderCardServer';

// Imagen de vista previa del pedido (1200×630) que WhatsApp muestra grande
// en el chat: fotos reales de los zapatos elegidos, talla, color, forma de
// pago y total, en negro y dorado.
export const runtime = 'nodejs';

const GOLD = '#D4AF37';
const fonts = Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/LiberationSans-Regular.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/LiberationSans-Bold.ttf')),
]);

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trim()}…` : s);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const data = parseOrderCard(url.searchParams.get('n') ?? '', {
    i: url.searchParams.get('i') ?? undefined,
    pm: url.searchParams.get('pm') ?? undefined,
    tot: url.searchParams.get('tot') ?? undefined,
  });
  const [items, [regular, bold]] = await Promise.all([resolveOrderCard(data, { withPhotos: true, origin: url.origin }), fonts]);
  const shown = items.slice(0, 3);
  const extra = items.length - shown.length;
  const pairs = items.reduce((n, i) => n + i.quantity, 0);
  const main = items.find((i) => i.photo);
  const thumbs = items.filter((i) => i.photo && i !== main).slice(0, 3);
  const complete = items.length > 0 && items.every((i) => i.photo);

  const image = new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', background: '#0a0a0a', fontFamily: 'Liberation' }}>
        {/* Fotos */}
        <div style={{ width: 600, height: 630, display: 'flex', position: 'relative', background: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          {main?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={main.photo} width={560} height={560} style={{ objectFit: 'contain' }} alt="" />
          ) : (
            <div style={{ display: 'flex', fontSize: 160, fontWeight: 700, color: GOLD }}>BS</div>
          )}
          {thumbs.length > 0 && (
            <div style={{ position: 'absolute', left: 24, bottom: 24, display: 'flex', gap: 12 }}>
              {thumbs.map((t, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={t.photo} width={120} height={120} style={{ borderRadius: 18, border: `3px solid ${GOLD}`, background: '#fff', objectFit: 'contain' }} alt="" />
              ))}
            </div>
          )}
          {pairs > 1 && (
            <div style={{ position: 'absolute', right: 24, top: 24, display: 'flex', background: '#0a0a0a', color: GOLD, borderRadius: 999, padding: '10px 22px', fontSize: 24, fontWeight: 700 }}>
              {pairs} pares
            </div>
          )}
        </div>

        {/* Detalle */}
        <div style={{ width: 600, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 52px', color: '#FFFFFF', borderLeft: `6px solid ${GOLD}` }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, letterSpacing: 8, color: GOLD }}>BROOKLYN STORE</div>
            <div style={{ display: 'flex', marginTop: 14, fontSize: 34, fontWeight: 700 }}>Pedido {data.orderNumber}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {shown.map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', fontSize: 30, fontWeight: 700 }}>{cut(item.title, 30)}</div>
                <div style={{ display: 'flex', marginTop: 4, fontSize: 23, color: GOLD }}>
                  {[item.size && `Talla ${item.size}`, item.color, `x${item.quantity}`].filter(Boolean).join('  ·  ')}
                </div>
              </div>
            ))}
            {extra > 0 && <div style={{ display: 'flex', fontSize: 22, color: 'rgba(255,255,255,0.6)' }}>+ {extra} producto{extra > 1 ? 's' : ''} más</div>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  display: 'flex',
                  background: 'linear-gradient(135deg, #e2c877, #c9a646 45%, #a8822c)',
                  color: '#0a0a0a',
                  borderRadius: 999,
                  padding: '12px 24px',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 2,
                }}
              >
                {data.cod ? 'PAGO CONTRA ENTREGA' : 'PAGO INMEDIATO'}
              </div>
              {data.total > 0 && <div style={{ display: 'flex', fontSize: 40, fontWeight: 700 }}>{formatPrice(data.total)}</div>}
            </div>
            <div style={{ display: 'flex', fontSize: 20, color: 'rgba(255,255,255,0.6)' }}>Envío Servientrega · Cambio de talla en 48 h</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Liberation', data: regular, weight: 400, style: 'normal' },
        { name: 'Liberation', data: bold, weight: 700, style: 'normal' },
      ],
    },
  );
  // Con todas las fotos la tarjeta no cambia nunca. Si faltó alguna
  // (Firestore ocupado) se vuelve a intentar pronto.
  return new Response(image.body, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': complete ? 'public, max-age=86400, s-maxage=31536000, immutable' : 'public, max-age=60, s-maxage=300',
    },
  });
}
