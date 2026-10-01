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

const SUFFIXES = new Set(['low', 'mid', 'high', 'og', 'pro', 'lite', 'plus', 'retro', 'premium', 'x', 'se', 'lx', 'gtx', 'ii', 'iii', 'iv', 'v']);

/**
 * Colección (línea) de un modelo dentro de su marca, deducida del nombre:
 * "Nike Air Force 1 Low" → "Air Force", "On Cloudnova Form 2" → "Cloudnova",
 * "New Balance 530" → "530", "Adidas Samba OG" → "Samba".
 */
export function suggestLine(title: string, brand: string): string {
  let rest = title.trim();
  const b = brand.trim();
  if (b && rest.toLowerCase().startsWith(b.toLowerCase())) rest = rest.slice(b.length).trim();
  const words = rest.split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  // Modelos con número: "530" se queda; "1" queda como "Jordan 1".
  if (/^\d/.test(words[0])) return words[0].length <= 2 && b ? `${b} ${words[0]}` : words[0];
  const picked: string[] = [];
  for (const w of words) {
    if (/^\d/.test(w) || SUFFIXES.has(w.toLowerCase()) || /[\/()-]/.test(w)) break;
    // La segunda palabra solo cuenta si es parte del nombre ("Air Max"),
    // no un detalle en minúscula ("Cloud ultra").
    if (picked.length === 1 && !/^[A-ZÁÉÍÓÚÑ]/.test(w) && picked[0].length > 3) break;
    picked.push(w);
    if (picked.length === 2) break;
  }
  const line = picked.join(' ');
  return line.charAt(0).toUpperCase() + line.slice(1);
}

// Colección de un producto: la elegida o la deducida del nombre.
export function productLine(p: { title: string; brand: string; line?: string }): string {
  return (p.line && p.line.trim()) || suggestLine(p.title, p.brand);
}
