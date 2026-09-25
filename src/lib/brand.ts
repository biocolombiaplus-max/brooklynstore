import type { FeaturedBrand } from './types';

export function isStarBrand(featured: FeaturedBrand, brand: string | undefined): boolean {
  if (!featured.enabled || !brand) return false;
  return brand.trim().toLowerCase() === featured.name.trim().toLowerCase();
}

export function brandHref(brand: string): string {
  return `/catalogo?marca=${encodeURIComponent(brand)}`;
}
