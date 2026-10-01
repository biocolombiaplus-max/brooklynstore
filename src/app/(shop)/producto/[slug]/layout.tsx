import type { Metadata } from 'next';
import { findShareProduct as findProduct } from '@/lib/productShare';
import { formatPrice } from '@/lib/utils';

// Vista previa al compartir el link de un producto (WhatsApp, Facebook...):
// foto del zapato, nombre y precio. La página en sí se renderiza en el
// cliente, así que los datos se leen aquí con la API REST pública de Firestore.

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await findProduct(params.slug);
  if (!product) return {};
  const title = `${product.title} — ${formatPrice(product.price)}`;
  const description = `${product.brand ? `${product.brand}. ` : ''}Envío a todo el Ecuador · Pago contra entrega: adelantas $5 y el resto al recibir.`;
  const images = product.image ? [{ url: product.image, width: 1200, height: 1200, alt: product.title }] : undefined;
  return {
    title,
    description,
    openGraph: { title: `${title} | Brooklyn Store`, description, type: 'website', ...(images ? { images } : {}) },
    twitter: { card: 'summary_large_image', title, description, ...(images ? { images: images.map((i) => i.url) } : {}) },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
