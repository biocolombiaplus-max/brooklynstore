import type { Metadata } from 'next';
import Link from 'next/link';
import { orderCardQuery, parseOrderCard } from '@/lib/orderCard';
import { resolveOrderCard } from '@/lib/orderCardServer';
import { formatPrice } from '@/lib/utils';

// Pedido enviado por WhatsApp desde la web: muestra las fotos reales de los
// zapatos elegidos (color, talla, cantidad). Su vista previa en el chat es
// la tarjeta premium de /api/og/pedido.

interface Props {
  params: { n: string };
  searchParams: { i?: string; pm?: string; tot?: string };
}

export const revalidate = 3600;

const photoSrc = (src: string) => (src.startsWith('/api/img/') ? `${src.split('?')[0]}?w=640&q=75` : src);

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const data = parseOrderCard(params.n, searchParams);
  const items = await resolveOrderCard(data);
  const title = `Pedido ${data.orderNumber} · Brooklyn Store`;
  const description = [
    items.map((i) => `${i.title} talla ${i.size}${i.color ? ` ${i.color}` : ''}`).join(' + '),
    data.cod ? 'Pago contra entrega' : 'Pago inmediato',
    data.total ? `Total ${formatPrice(data.total)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const image = `/api/og/pedido?n=${encodeURIComponent(data.orderNumber)}&${orderCardQuery(data)}`;
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, type: 'website', images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function PedidoWebPage({ params, searchParams }: Props) {
  const data = parseOrderCard(params.n, searchParams);
  const items = await resolveOrderCard(data);

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <p className="text-center text-[11px] font-extrabold uppercase tracking-[0.3em] text-primary-light">Brooklyn Store</p>
        <h1 className="mt-2 text-center font-heading text-xl font-black uppercase text-white">
          Tu pedido <span className="block whitespace-nowrap text-primary-light">{data.orderNumber}</span>
        </h1>
        <div className="mt-6 space-y-4">
          {items.map((item, i) => (
            <div key={i} className="overflow-hidden rounded-3xl bg-white shadow-dark">
              <div className="bg-white">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoSrc(item.image)} alt={item.title} className="aspect-square w-full object-contain" />
                ) : (
                  <div className="flex aspect-square items-center justify-center font-display text-6xl text-primary/50">BS</div>
                )}
              </div>
              <div className="space-y-3 p-5">
                <h2 className="text-lg font-black uppercase leading-tight text-ink">{item.title}</h2>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  {item.size && <span className="rounded-full bg-gold-gradient px-3 py-1.5 text-ink">Talla {item.size}</span>}
                  {item.color && <span className="rounded-full bg-ink px-3 py-1.5 text-white">{item.color}</span>}
                  <span className="rounded-full bg-cream-alt px-3 py-1.5 text-ink">x{item.quantity}</span>
                </div>
                <Link href={`/producto/${item.slug}`} className="block text-xs font-bold text-muted underline underline-offset-4">
                  Ver el producto en la tienda
                </Link>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/5 px-5 py-4 text-white ring-1 ring-primary/40">
          <span className="rounded-full bg-gold-gradient px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-ink">
            {data.cod ? 'Pago contra entrega' : 'Pago inmediato'}
          </span>
          {data.total > 0 && <span className="text-2xl font-black">{formatPrice(data.total)}</span>}
        </div>
        <p className="mt-4 text-center text-xs text-white/50">Envío Servientrega a todo Ecuador · Cambio de talla en 48 h</p>
      </div>
    </main>
  );
}
