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
import { mapProduct } from './productMap';

const COLLECTION = 'products';

function toProduct(id: string, data: any): Product {
  return mapProduct(id, data, (value) => (value instanceof Timestamp ? value.toMillis() : undefined));
}

export async function getAllProducts(): Promise<Product[]> {
  const snap = await getDocs(query(collection(db, COLLECTION), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => toProduct(d.id, d.data()));
}

// Productos activos leídos directo de Firestore (respaldo de /api/products).
export async function getActiveProductsDirect(): Promise<Product[]> {
  if (!db) return DEMO_PRODUCTS;
  try {
    // Con la tienda configurada nunca se muestran zapatos de demostración:
    // si algo falla, mejor no mostrar nada que mostrar productos falsos.
    return (await getAllProducts()).filter((p) => p.active);
  } catch {
    return [];
  }
}

export { getActiveProducts, getFeaturedProducts, getRelatedProducts } from './productsClient';

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
