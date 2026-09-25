'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getActiveProducts } from '@/lib/products';
import type { Product } from '@/lib/types';
import { classNames } from '@/lib/utils';
import ProductGrid, { ProductGridSkeleton } from './ProductGrid';
import { discountPercentOf } from './ProductCard';

type Tab = 'vendidos' | 'nuevos' | 'ofertas';

const TABS: { value: Tab; label: string }[] = [
  { value: 'vendidos', label: 'Más vendidos' },
  { value: 'nuevos', label: 'Lo nuevo' },
  { value: 'ofertas', label: 'Ofertas' },
];

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [tab, setTab] = useState<Tab>('vendidos');

  useEffect(() => {
    let cancelled = false;
    getActiveProducts()
      .then((list) => !cancelled && setProducts(list))
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(() => {
    if (!products) return [];
    const list = [...products];
    if (tab === 'nuevos') return list.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || (b.createdAt ?? 0) - (a.createdAt ?? 0)).slice(0, 8);
    if (tab === 'ofertas') return list.filter((p) => discountPercentOf(p) > 0).sort((a, b) => discountPercentOf(b) - discountPercentOf(a)).slice(0, 8);
    return list.sort((a, b) => Number(b.featured) - Number(a.featured) || (b.soldCount ?? 0) - (a.soldCount ?? 0)).slice(0, 8);
  }, [products, tab]);

  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container-page">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-eyebrow">Los favoritos del Ecuador</p>
            <h2 className="section-title mt-2">Lo que todos están pidiendo</h2>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={classNames(
                  'shrink-0 rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all',
                  tab === t.value ? 'bg-ink text-white shadow-dark' : 'border border-border bg-white text-ink hover:border-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {products === null ? <ProductGridSkeleton /> : <ProductGrid products={shown} emptyMessage="Pronto tendremos más modelos aquí. ¡Pilas!" />}

        <div className="mt-10 text-center">
          <Link href="/catalogo" className="btn-secondary">
            Ver todo el catálogo →
          </Link>
        </div>
      </div>
    </section>
  );
}
