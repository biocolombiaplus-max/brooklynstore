import { NextResponse } from 'next/server';
import { getActiveProductsServer } from '@/lib/productsServer';
import { slimProduct } from '@/lib/productMap';

// Lista liviana de productos activos para el navegador. La CDN de Vercel la
// guarda 5 min y la sigue sirviendo al instante mientras se refresca; los
// datos de Firestore vienen de la caché de una hora (sin gastar lecturas).
export const revalidate = 3600;

export async function GET() {
  let list;
  try {
    list = await getActiveProductsServer({ demoFallback: false });
  } catch {
    // Error temporal: no se guarda en caché, el navegador reintenta directo.
    return NextResponse.json({ error: 'temporal' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  const products = list.map(slimProduct);
  return NextResponse.json(products, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=86400' },
  });
}
