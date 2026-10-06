import ProductView from './ProductView';
import { getProductBySlugServer } from '@/lib/productsServer';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app').replace(/\/$/, '');

const absolute = (url: string) => (url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`);

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlugServer(params.slug);
  const active = product && product.active ? product : null;

  // Ficha de producto para Google (precio, disponibilidad, reseñas, fotos):
  // permite que aparezca con estrellas y precio en los resultados.
  const reviews = active?.reviews ?? [];
  const jsonLd = active && {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: active.title,
    image: active.images.slice(0, 6).map(absolute),
    description: active.description || `${active.title}. Envío a todo el Ecuador y pago contra entrega.`,
    sku: active.id,
    ...(active.brand ? { brand: { '@type': 'Brand', name: active.brand } } : {}),
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/producto/${active.slug}`,
      priceCurrency: 'USD',
      price: active.price.toFixed(2),
      availability: active.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Brooklyn Store' },
    },
    ...(reviews.length > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
            reviewCount: Math.max(reviews.length, active.reviewsCount ?? 0),
          },
          review: reviews.slice(0, 5).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.name },
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            reviewBody: r.text,
          })),
        }
      : {}),
  };

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />}
      <ProductView initialProduct={product} />
    </>
  );
}
