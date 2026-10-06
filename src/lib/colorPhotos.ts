import type { ProductColor } from './types';

// Fotos por color (como las variantes de Shopify): cada foto puede ser de un
// color; un color puede tener varias fotos (ángulos). El orden siempre es el
// de la galería del producto.

export function colorPhotoSet(c: Pick<ProductColor, 'image' | 'images'>): string[] {
  if (c.images && c.images.length) return c.images;
  return c.image ? [c.image] : [];
}

// Fotos de un color, en el orden de la galería.
export function photosForColor(product: { images: string[]; colors: ProductColor[] }, colorName?: string): string[] {
  const color = product.colors.find((c) => c.name === colorName);
  if (!color) return [];
  const set = colorPhotoSet(color);
  const ordered = product.images.filter((u) => set.includes(u));
  return ordered.length ? ordered : set;
}

// Fotos que no son de ningún color (ej. la suela, la caja): se muestran con todos.
export function sharedPhotos(product: { images: string[]; colors: ProductColor[] }): string[] {
  const used = new Set(product.colors.flatMap(colorPhotoSet));
  return product.images.filter((u) => !used.has(u));
}

// Galería para el color elegido: sus fotos primero y luego las generales.
// Si el color no tiene fotos asignadas, se muestran todas.
export function galleryForColor(product: { images: string[]; colors: ProductColor[] }, colorName?: string): string[] {
  const own = photosForColor(product, colorName);
  if (!own.length) return product.images;
  return [...own, ...sharedPhotos(product).filter((u) => !own.includes(u))];
}

// Ordena la galería agrupando por color (en el orden de los colores) y deja
// al final las fotos generales. Dentro de cada grupo respeta el orden actual.
export function groupImagesByColor(images: string[], colors: ProductColor[]): string[] {
  const groupOf = (url: string) => {
    const i = colors.findIndex((c) => colorPhotoSet(c).includes(url));
    return i === -1 ? colors.length : i;
  };
  return images
    .map((url, i) => ({ url, i, g: groupOf(url) }))
    .sort((a, b) => a.g - b.g || a.i - b.i)
    .map((x) => x.url);
}

// Deja cada color con sus fotos en el orden de la galería y `image` = la primera.
export function normalizeColorPhotos(images: string[], colors: ProductColor[]): ProductColor[] {
  return colors.map((c) => {
    const set = colorPhotoSet(c).filter((u) => images.includes(u));
    const ordered = images.filter((u) => set.includes(u));
    const rest = { ...c };
    delete rest.image;
    delete rest.images;
    return ordered.length ? { ...rest, image: ordered[0], images: ordered } : rest;
  });
}
