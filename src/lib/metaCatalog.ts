import type { Product } from './types';

// ID de cada artículo en el catálogo de Meta. El píxel envía estos mismos
// IDs, así Meta sabe exactamente qué zapato (y qué color) vio o compró cada
// persona y se lo puede volver a mostrar en los anuncios.
export function slugifyColor(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function metaItemId(product: Pick<Product, 'id' | 'colors'>, colorName?: string): string {
  const colors = (product.colors ?? []).filter((c) => c.name);
  if (colors.length <= 1) return product.id;
  const color = colors.find((c) => c.name === colorName) ?? colors[0];
  return `${product.id}-${slugifyColor(color.name)}`.slice(0, 100);
}
