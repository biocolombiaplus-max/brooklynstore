// Productos leídos en el SERVIDOR con la API REST pública de Firestore.
// Así la portada, el catálogo y la ficha llegan con los zapatos ya puestos
// en el HTML (rápido en el celular y visibles para Google), en vez de
// esperar a que el navegador descargue Firebase y consulte la base.
import { FIREBASE_CONFIG } from './firebase-config';
import { DEMO_PRODUCTS } from './demo-products';
import { mapProduct } from './productMap';
import type { Product } from './types';

// Cada cuánto se refrescan los datos en caché (segundos). Es largo a
// propósito: cada lectura de todo el catálogo gasta una lectura de Firestore
// por producto (cuota gratuita: 50.000 al día). Al guardar en el panel la
// caché se borra al instante (ver /api/revalidate).
export const PRODUCTS_REVALIDATE = 3600;

function unwrapValue(value: any): any {
  if (value == null) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return Date.parse(value.timestampValue);
  if ('nullValue' in value) return null;
  if ('mapValue' in value) return unwrapFields(value.mapValue.fields ?? {});
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(unwrapValue);
  return null;
}

function unwrapFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) result[key] = unwrapValue(value);
  return result;
}

const toMillis = (v: unknown) => (typeof v === 'number' && !Number.isNaN(v) ? v : undefined);

function docToProduct(doc: { name: string; fields?: Record<string, any> }): Product {
  const id = doc.name.split('/').pop() ?? '';
  return mapProduct(id, unwrapFields(doc.fields ?? {}), toMillis);
}

const base = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;

async function fetchJson(url: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    let res = await fetch(url, { ...init, signal: controller.signal, next: { revalidate: PRODUCTS_REVALIDATE, tags: ['products'] } });
    // Un reintento rápido si Firestore falla por un instante.
    if (!res.ok && res.status >= 500) res = await fetch(url, { ...init, signal: controller.signal, next: { revalidate: PRODUCTS_REVALIDATE, tags: ['products'] } });
    if (!res.ok) throw new Error(`Firestore ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

// Todos los productos activos, más nuevos primero. Si la tienda aún no tiene
// productos (o Firestore no responde) se usa el catálogo de demostración.
export async function getActiveProductsServer(opts: { demoFallback?: boolean } = {}): Promise<Product[]> {
  const fallback = opts.demoFallback !== false;
  if (!FIREBASE_CONFIG.projectId) {
    if (fallback) return DEMO_PRODUCTS;
    throw new Error('Firebase sin configurar');
  }
  try {
    const all: Product[] = [];
    let pageToken = '';
    for (let page = 0; page < 10; page++) {
      const json = await fetchJson(`${base()}/products?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
      for (const doc of json.documents ?? []) all.push(docToProduct(doc));
      pageToken = json.nextPageToken ?? '';
      if (!pageToken) break;
    }
    const active = all.filter((p) => p.active && p.slug).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return active;
  } catch (err) {
    // Nunca productos de demostración en la tienda real: mejor vacío.
    if (!fallback) throw err;
    return [];
  }
}

export async function getProductBySlugServer(slug: string): Promise<Product | null> {
  if (FIREBASE_CONFIG.projectId) {
    try {
      const rows = await fetchJson(`${base()}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'products' }],
            where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: slug } } },
            limit: 1,
          },
        }),
      });
      const doc = (rows as { document?: { name: string; fields?: Record<string, unknown> } }[]).find((r) => r.document)?.document;
      if (doc) return docToProduct(doc as { name: string; fields?: Record<string, never> });
    } catch {
      // Sin respuesta: se intenta con el catálogo de demostración.
    }
  }
  return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
}
