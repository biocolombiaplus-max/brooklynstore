import type { MetadataRoute } from 'next';
import { getActiveProductsServer } from '@/lib/productsServer';
import { canonicalBrands } from '@/lib/brand';
import { HELP_PAGES } from '@/lib/help-pages';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app').replace(/\/$/, '');

export const revalidate = 3600;

// Mapa del sitio para Google: portada, catálogo, cada marca, cada zapato y
// las páginas de ayuda. Se actualiza solo cuando se agregan productos.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getActiveProductsServer();
  const now = new Date();
  const brands = canonicalBrands(products.map((p) => p.brand));
  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/catalogo`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/catalogo?genero=hombre`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/catalogo?genero=mujer`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    ...brands.map((b) => ({ url: `${SITE_URL}/catalogo?marca=${encodeURIComponent(b)}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...products.map((p) => ({
      url: `${SITE_URL}/producto/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      images: p.images.slice(0, 3).map((src) => (src.startsWith('http') ? src : `${SITE_URL}${src}`)),
    })),
    { url: `${SITE_URL}/guia-de-tallas`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/ayuda`, changeFrequency: 'monthly', priority: 0.4 },
    ...HELP_PAGES.map((h) => ({ url: `${SITE_URL}/ayuda/${h.slug}`, changeFrequency: 'monthly' as const, priority: 0.3 })),
  ];
}
