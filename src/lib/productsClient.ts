import type { Product } from './types';

// Productos para la tienda, sin cargar Firebase: se piden a /api/products
// (en caché en la CDN, carga al instante). Solo si eso falla se carga la
// base de datos como respaldo.

let activeProductsCache: Promise<Product[]> | null = null;

async function direct(): Promise<Product[]> {
  const { getActiveProductsDirect } = await import('./products');
  return getActiveProductsDirect();
}

export function getActiveProducts(): Promise<Product[]> {
  if (typeof window === 'undefined') return direct();
  activeProductsCache ??= fetch('/api/products')
    .then((res) => (res.ok ? (res.json() as Promise<Product[]>) : Promise.reject(new Error(String(res.status)))))
    .then((list) => (Array.isArray(list) && list.length > 0 ? list : direct()))
    .catch(() => {
      activeProductsCache = null;
      return direct();
    });
  return activeProductsCache;
}

export async function getFeaturedProducts(max = 8): Promise<Product[]> {
  const products = await getActiveProducts();
  const featured = products.filter((p) => p.featured);
  return (featured.length > 0 ? featured : products).slice(0, max);
}

// Primero del mismo estilo, luego de la misma marca y, si faltan, cualquiera.
export async function getRelatedProducts(current: Product, max = 4): Promise<Product[]> {
  const products = (await getActiveProducts()).filter((p) => p.id !== current.id);
  const score = (p: Product) => (p.collection === current.collection ? 2 : 0) + (p.brand === current.brand ? 1 : 0);
  return [...products].sort((a, b) => score(b) - score(a) || (b.soldCount ?? 0) - (a.soldCount ?? 0)).slice(0, max);
}

// La ficha ya llega con el producto desde el servidor; esto es solo respaldo.
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { getProductBySlug: fromDb } = await import('./products');
  return fromDb(slug);
}
