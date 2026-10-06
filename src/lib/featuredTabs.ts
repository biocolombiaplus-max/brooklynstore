import { discountPercentOf } from './discount';
import type { Product } from './types';

// Las 3 pestañas de "Lo que todos están pidiendo" en la portada.
export function featuredTabs(products: Product[], max = 8) {
  const list = () => [...products];
  return {
    vendidos: list()
      .sort((a, b) => Number(b.featured) - Number(a.featured) || (b.soldCount ?? 0) - (a.soldCount ?? 0))
      .slice(0, max),
    nuevos: list()
      .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, max),
    ofertas: list()
      .filter((p) => discountPercentOf(p) > 0)
      .sort((a, b) => discountPercentOf(b) - discountPercentOf(a))
      .slice(0, max),
  };
}
