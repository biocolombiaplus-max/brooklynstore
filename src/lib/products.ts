import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as fbLimit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Product, ProductInput } from './types';
import { DEMO_PRODUCTS } from './demo-products';
import { stripUndefined } from './utils';

const COLLECTION = 'products';

function toProduct(id: string, data: any): Product {
  const toMillis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : undefined);
  return {
    id,
    slug: data.slug,
    title: data.title,
    brand: data.brand ?? '',
    gender: ['hombre', 'mujer', 'unisex'].includes(data.gender) ? data.gender : 'unisex',
    description: data.description ?? '',
    price: data.price ?? 0,
    compareAtPrice: data.compareAtPrice ?? null,
    images: data.images ?? [],
    sizes: data.sizes ?? [],
    colors: data.colors ?? [],
    collection: data.collection ?? 'urbanos',
    fit: data.fit ?? 'normal',
    stock: data.stock ?? 0,
    featured: !!data.featured,
    isNew: !!data.isNew,
    active: data.active !== false,
    soldCount: data.soldCount ?? 0,
    reviewsCount: data.reviewsCount ?? 0,
    reviews: data.reviews ?? [],
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => toProduct(d.id, d.data()));
}

// Productos que ve el público: los reales de Firestore, o el catálogo de
// demostración mientras la tienda todavía no tiene ninguno publicado (o si
// Firebase aún no está configurado).
export async function getActiveProducts(): Promise<Product[]> {
  if (!db) return DEMO_PRODUCTS;
  try {
    const products = (await getAllProducts()).filter((p) => p.active);
    return products.length > 0 ? products : DEMO_PRODUCTS;
  } catch {
    return DEMO_PRODUCTS;
  }
}

export async function getFeaturedProducts(max = 8): Promise<Product[]> {
  const products = await getActiveProducts();
  const featured = products.filter((p) => p.featured);
  return (featured.length > 0 ? featured : products).slice(0, max);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (db) {
    try {
      const snap = await getDocs(query(collection(db, COLLECTION), where('slug', '==', slug), fbLimit(1)));
      if (!snap.empty) return toProduct(snap.docs[0].id, snap.docs[0].data());
    } catch {
      // Si Firestore falla se intenta con el catálogo de demostración.
    }
  }
  return DEMO_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const ref = doc(db, COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return toProduct(snap.id, snap.data());
}

// Primero del mismo estilo, luego de la misma marca y, si faltan, cualquiera.
export async function getRelatedProducts(current: Product, max = 4): Promise<Product[]> {
  const products = (await getActiveProducts()).filter((p) => p.id !== current.id);
  const score = (p: Product) => (p.collection === current.collection ? 2 : 0) + (p.brand === current.brand ? 1 : 0);
  return [...products].sort((a, b) => score(b) - score(a) || (b.soldCount ?? 0) - (a.soldCount ?? 0)).slice(0, max);
}

// Dos productos con la misma URL (slug) rompen la tienda: al abrir esa URL,
// Firestore devuelve cualquiera de los dos (el que encuentre primero) sin
// avisar — así fue como "Sandalia Prada" terminó abriendo otra referencia.
// Se valida ANTES de guardar para que ese choque ya no pueda volver a pasar.
async function isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const snap = await getDocs(query(collection(db, COLLECTION), where('slug', '==', slug)));
  return snap.docs.some((d) => d.id !== excludeId);
}

export async function createProduct(input: ProductInput): Promise<string> {
  if (await isSlugTaken(input.slug)) {
    throw new Error(`Ya existe otro producto con la URL "${input.slug}". Cambia el slug e intenta de nuevo.`);
  }
  const ref = await addDoc(collection(db, COLLECTION), {
    ...stripUndefined(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<void> {
  if (input.slug && (await isSlugTaken(input.slug, id))) {
    throw new Error(`Ya existe otro producto con la URL "${input.slug}". Cambia el slug e intenta de nuevo.`);
  }
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { ...stripUndefined(input), updatedAt: serverTimestamp() });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
