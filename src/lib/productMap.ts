import type { Product } from './types';

// Convierte un documento de producto (del SDK de Firestore o de la API REST)
// en un Product. Sin dependencias de Firebase para poder usarse en el servidor.
export function mapProduct(id: string, data: any, toMillis: (value: unknown) => number | undefined): Product {
  return {
    id,
    slug: data.slug,
    title: data.title,
    brand: data.brand ?? '',
    line: data.line ?? '',
    gender: ['hombre', 'mujer', 'unisex'].includes(data.gender) ? data.gender : 'unisex',
    description: data.description ?? '',
    price: data.price ?? 0,
    compareAtPrice: data.compareAtPrice ?? null,
    codPrice: data.codPrice ?? null,
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

// Versión liviana para listas (tarjetas del catálogo y la portada): sin
// descripción ni reseñas, que solo se usan en la ficha del producto.
export function slimProduct(p: Product): Product {
  return { ...p, description: '', reviews: [] };
}
