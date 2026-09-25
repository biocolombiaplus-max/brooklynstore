import type { FeaturedBrand } from './types';

export function isStarBrand(featured: FeaturedBrand, brand: string | undefined): boolean {
  if (!featured.enabled || !brand) return false;
  return brand.trim().toLowerCase() === featured.name.trim().toLowerCase();
}

export function brandHref(brand: string): string {
  return `/catalogo?marca=${encodeURIComponent(brand)}`;
}

// El lema de la marca sin repetir su nombre al inicio: "On. Corre sobre
// nubes." → "Corre sobre nubes." (el nombre ya se muestra en grande aparte).
export function brandTagline(featured: FeaturedBrand): string {
  const name = featured.name.trim();
  const heading = featured.heading.trim();
  if (!name) return heading;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return heading.replace(new RegExp(`^${escaped}[.:,!\\s—-]+`, 'i'), '').trim();
}
