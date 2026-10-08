import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { findShareProduct, shareImageFor } from '@/lib/productShare';

// "Foto del pedido": página liviana que muestra la foto del modelo en el
// color exacto que pidió el cliente, con talla y color. Su vista previa en
// WhatsApp es esa misma foto, así el pedido llega con imagen y no hay
// errores al despachar.

interface Props {
  params: { slug: string };
  searchParams: { c?: string; t?: string; n?: string };
}

export const revalidate = 3600;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const product = await findShareProduct(params.slug);
  if (!product) return { title: 'Foto del pedido' };
  const image = shareImageFor(product, searchParams.c);
  const details = [searchParams.c, searchParams.t ? `Talla ${searchParams.t}` : '', searchParams.n ? `x${searchParams.n}` : ''].filter(Boolean).join(' · ');
  const title = `${product.title}${details ? ` — ${details}` : ''}`;
  return {
    title,
    description: 'Foto del modelo pedido en Brooklyn Store',
    robots: { index: false },
    openGraph: { title, description: 'Foto del modelo pedido · Brooklyn Store', type: 'website', ...(image ? { images: [{ url: image, width: 1200, height: 1200, alt: product.title }] } : {}) },
    twitter: { card: 'summary_large_image', title, ...(image ? { images: [image] } : {}) },
  };
}

export default async function FotoPedidoPage({ params, searchParams }: Props) {
  const product = await findShareProduct(params.slug);
  if (!product) notFound();
  const image = shareImageFor(product, searchParams.c);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a] p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-dark">
        <div className="bg-cream-alt">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.title} className="aspect-square w-full object-contain" />
          ) : (
            <div className="flex aspect-square items-center justify-center font-display text-6xl text-primary/50">BS</div>
          )}
        </div>
        <div className="space-y-3 p-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary-hover">Foto del pedido · Brooklyn Store</p>
          <h1 className="text-xl font-black uppercase leading-tight text-ink">{product.title}</h1>
          <div className="flex flex-wrap gap-2 text-xs font-bold">
            {searchParams.c && <span className="rounded-full bg-ink px-3 py-1.5 text-white">🎨 {searchParams.c}</span>}
            {searchParams.t && <span className="rounded-full bg-gold-gradient px-3 py-1.5 text-ink">📏 Talla {searchParams.t}</span>}
            {searchParams.n && <span className="rounded-full bg-cream-alt px-3 py-1.5 text-ink">x{searchParams.n}</span>}
          </div>
          <Link href={`/producto/${params.slug}`} className="btn-primary mt-2 w-full">
            Ver el producto en la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
