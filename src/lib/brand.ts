import type { FeaturedBrand } from './types';

const norm = (b: string) => b.trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * ¿El producto es de esta marca? Agrupa variantes de escritura: "On",
 * "ON", "On Cloud" y "On Running" son la misma marca "On" (pero "Onitsuka
 * Tiger" no, porque no empieza con "on ").
 */
export function brandMatches(productBrand: string | undefined, brand: string | undefined): boolean {
  if (!productBrand || !brand) return false;
  const a = norm(productBrand);
  const b = norm(brand);
  return a === b || a.startsWith(`${b} `) || b.startsWith(`${a} `);
}

// Lista de marcas sin duplicados por escritura: se queda la versión corta.
export function canonicalBrands(brands: string[]): string[] {
  const unique = Array.from(new Set(brands.map((b) => b.trim()).filter(Boolean)));
  return unique.filter((b) => !unique.some((o) => o !== b && norm(b).startsWith(`${norm(o)} `)));
}

export function isStarBrand(featured: FeaturedBrand, brand: string | undefined): boolean {
  if (!featured.enabled || !brand) return false;
  return brandMatches(brand, featured.name);
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
