import type { Product } from './types';

export function discountPercentOf(product: Pick<Product, 'price' | 'compareAtPrice'>): number {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.compareAtPrice) * 100);
}
