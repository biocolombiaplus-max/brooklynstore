'use client';

import { useEffect, useState } from 'react';
import { getRelatedProducts } from '@/lib/products';
import type { Product } from '@/lib/types';
import ProductGrid, { ProductGridSkeleton } from '../ProductGrid';

export default function RelatedProducts({ product }: { product: Product }) {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRelatedProducts(product, 4)
      .then((list) => !cancelled && setProducts(list))
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, [product]);

  if (products !== null && products.length === 0) return null;

  return (
    <section className="border-t border-border bg-white py-14">
      <div className="container-page">
        <p className="section-eyebrow">Para que combines</p>
        <h2 className="section-title mt-2 mb-8">También te puede gustar</h2>
        {products === null ? <ProductGridSkeleton /> : <ProductGrid products={products} />}
      </div>
    </section>
  );
}
