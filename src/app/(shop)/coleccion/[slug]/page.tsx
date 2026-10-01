import { redirect } from 'next/navigation';
import { getSiteSettingsServer } from '@/lib/settingsServer';
import { brandMatches } from '@/lib/brand';

// Link corto y fácil de compartir para la colección de una marca:
// /coleccion/on o /coleccion/on-cloud → todos los On (hombre y mujer) con
// sus filtros. Ej. para Instagram, WhatsApp o anuncios.
export default async function ColeccionPage({ params }: { params: { slug: string } }) {
  const wanted = decodeURIComponent(params.slug).replace(/[-_]+/g, ' ').trim();
  const settings = await getSiteSettingsServer();
  // Entre las marcas que coinciden ("On", "On Cloud"...) se usa la más corta,
  // que agrupa a todas.
  const matches = settings.brands.filter((b) => brandMatches(wanted, b)).sort((a, b) => a.length - b.length);
  const brand = matches[0] ?? wanted.replace(/\b\w/g, (c) => c.toUpperCase());
  redirect(`/catalogo?marca=${encodeURIComponent(brand)}`);
}
