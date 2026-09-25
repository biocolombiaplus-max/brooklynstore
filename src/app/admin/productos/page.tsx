'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getAllProducts } from '@/lib/products';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    getAllProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, []);

  // Dos productos con la misma URL (slug) hacen que al abrir uno se muestre
  // el otro, al azar — se cuenta cuántas veces se repite cada slug para
  // avisar aquí mismo cuál hay que corregir.
  const slugCounts = new Map<string, number>();
  products?.forEach((p) => slugCounts.set(p.slug, (slugCounts.get(p.slug) ?? 0) + 1));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Productos</h1>
          <p className="text-sm text-muted">Gestiona el catálogo de tu tienda</p>
        </div>
        <Link href="/admin/productos/nuevo" className="btn-primary">
          + Agregar producto
        </Link>
      </div>

      <div className="overflow-x-auto rounded-card bg-white shadow-soft">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase text-muted">
            <tr>
              <th className="p-4">Producto</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Estado</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {products === null ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  Cargando...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted">
                  Todavía no tienes productos. ¡Agrega el primero!
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const slugDuplicated = (slugCounts.get(p.slug) ?? 0) > 1;
                return (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="flex items-center gap-3 p-4">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream-alt">
                      {p.images[0] && <Image src={p.images[0]} alt={p.title} fill className="object-cover" />}
                    </div>
                    <div>
                      <span className="font-semibold text-ink">{p.title}</span>
                      <p className={`text-xs ${slugDuplicated ? 'font-bold text-urgent' : 'text-muted'}`}>
                        /{p.slug}
                        {slugDuplicated && ' — ⚠️ URL duplicada, otro producto usa esta misma'}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">{formatPrice(p.price)}</td>
                  <td className="p-4">{p.stock}</td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.active ? 'bg-primary-light/20 text-primary-hover' : 'bg-border text-muted'
                      }`}
                    >
                      {p.active ? 'Publicado' : 'Oculto'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link href={`/admin/productos/${p.id}`} className="font-semibold text-primary hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
