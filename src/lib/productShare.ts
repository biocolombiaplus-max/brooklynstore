import { FIREBASE_CONFIG } from './firebase-config';
import { DEMO_PRODUCTS } from './demo-products';

// Datos mínimos de un producto para las vistas previas al compartir un link
// (WhatsApp, Facebook...). Se leen en el servidor con la API REST pública de
// Firestore porque las páginas de la tienda se renderizan en el cliente.

export interface ShareProduct {
  title: string;
  brand?: string;
  price: number;
  image?: string;
  colors: { name: string; image?: string }[];
}

export async function findShareProduct(slug: string): Promise<ShareProduct | null> {
  const projectId = FIREBASE_CONFIG.projectId;
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
        next: { revalidate: 3600, tags: ['products'] },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const rows = (await res.json()) as { document?: { fields?: Record<string, any> } }[];
        const f = rows.find((r) => r.document)?.document?.fields;
        if (f) {
          const colors = (f.colors?.arrayValue?.values ?? []).map((v: any) => ({
            name: v.mapValue?.fields?.name?.stringValue ?? '',
            image: v.mapValue?.fields?.image?.stringValue || undefined,
          }));
          return {
            title: f.title?.stringValue ?? '',
            brand: f.brand?.stringValue,
            price: Number(f.price?.doubleValue ?? f.price?.integerValue ?? 0),
            image: f.images?.arrayValue?.values?.[0]?.stringValue,
            colors,
          };
        }
      }
    } catch {
      // Sin respuesta de Firestore se usa el catálogo de demostración.
    }
  }
  const demo = DEMO_PRODUCTS.find((p) => p.slug === slug);
  return demo
    ? { title: demo.title, brand: demo.brand, price: demo.price, image: demo.images[0], colors: demo.colors.map((c) => ({ name: c.name, image: c.image })) }
    : null;
}

// Foto del color elegido (o la principal).
export function shareImageFor(product: ShareProduct, color?: string): string | undefined {
  const match = color ? product.colors.find((c) => c.name.toLowerCase() === color.toLowerCase())?.image : undefined;
  return match || product.image;
}
