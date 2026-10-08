import type { Metadata } from 'next';
import CatalogView from './CatalogView';
import { getActiveProductsServer } from '@/lib/productsServer';
import { slimProduct } from '@/lib/productMap';

export function generateMetadata({ searchParams }: { searchParams: { marca?: string; genero?: string } }): Metadata {
  const brand = searchParams.marca;
  const gender = searchParams.genero === 'hombre' ? 'hombre' : searchParams.genero === 'mujer' ? 'mujer' : '';
  const title = brand ? `Zapatos ${brand} en Ecuador` : gender ? `Zapatos de ${gender} en Ecuador` : 'Catálogo de zapatos en Ecuador';
  const description = `${brand ? `Todos los modelos ${brand}` : 'On Cloud, Nike, Adidas, Jordan, New Balance, Hoka y más'}${
    gender ? ` para ${gender}` : ''
  }. Envío a todo el Ecuador con Servientrega y pago contra entrega.`;
  return {
    title,
    description,
    alternates: { canonical: brand ? `/catalogo?marca=${encodeURIComponent(brand)}` : gender ? `/catalogo?genero=${gender}` : '/catalogo' },
    openGraph: { title, description },
  };
}

// Los zapatos llegan en el HTML: el catálogo aparece al instante y Google lo ve.
export default async function CatalogoPage() {
  const products = (await getActiveProductsServer()).map(slimProduct);
  return <CatalogView initialProducts={products} />;
}
