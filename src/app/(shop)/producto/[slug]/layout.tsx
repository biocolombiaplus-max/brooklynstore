import type { Metadata } from 'next';
import { DEMO_PRODUCTS } from '@/lib/demo-products';
import { formatPrice } from '@/lib/utils';

// Vista previa al compartir el link de un producto (WhatsApp, Facebook...):
// foto del zapato, nombre y precio. La página en sí se renderiza en el
// cliente, así que los datos se leen aquí con la API REST pública de Firestore.

interface ShareProduct {
  title: string;
  brand?: string;
  price: number;
  image?: string;
}

async function findProduct(slug: string): Promise<ShareProduct | null> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (projectId) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'products' }],
            where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } },
            limit: 1,
          },
        }),
        signal: controller.signal,
        next: { revalidate: 300 },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const rows = (await res.json()) as { document?: { fields?: Record<string, any> } }[];
        const f = rows.find((r) => r.document)?.document?.fields;
        if (f) {
          return {
            title: f.title?.stringValue ?? '',
            brand: f.brand?.stringValue,
            price: Number(f.price?.doubleValue ?? f.price?.integerValue ?? 0),
            image: f.images?.arrayValue?.values?.[0]?.stringValue,
          };
        }
      }
    } catch {
      // Sin respuesta de Firestore se usa el catálogo de demostración.
    }
  }
  const demo = DEMO_PRODUCTS.find((p) => p.slug === slug);
  return demo ? { title: demo.title, brand: demo.brand, price: demo.price, image: demo.images[0] } : null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await findProduct(params.slug);
  if (!product) return {};
  const title = `${product.title} — ${formatPrice(product.price)}`;
  const description = `${product.brand ? `${product.brand} 100% original. ` : '100% original. '}Envío a todo el Ecuador · Pago contra entrega: adelantas $5 y el resto al recibir.`;
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
