'use client';

import { useEffect, useState } from 'react';
import { getFeaturedProducts } from '@/lib/products';
import type { Product } from '@/lib/types';
import ProductGrid from '../ProductGrid';

// La página de confirmación es uno de los momentos de más atención de toda
// la compra (la clienta ya pagó y sigue mirando la pantalla) — aprovecharlo
// para mostrarle más productos es un cross-sell clásico que hasta ahora no
// se usaba en el sitio.
export default function PostPurchaseUpsell({ excludeProductIds }: { excludeProductIds: string[] }) {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getFeaturedProducts(8)
      .then((list) => !cancelled && setProducts(list.filter((p) => !excludeProductIds.includes(p.id)).slice(0, 4)))
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excludeProductIds.join(',')]);

  if (products !== null && products.length === 0) return null;

  return (
    <div className="mt-10 text-left">
      <h2 className="mb-4 font-heading text-lg font-bold text-ink">✨ También te puede gustar</h2>
      {products === null ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-card" />
          ))}
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
