'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllProducts } from '@/lib/products';
import { getAllOrders } from '@/lib/orders';
import { formatPrice } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    products: number;
    activeProducts: number;
    orders: number;
    pendingOrders: number;
    revenue: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [products, orders] = await Promise.all([getAllProducts(), getAllOrders()]);
        setStats({
          products: products.length,
          activeProducts: products.filter((p) => p.active).length,
          orders: orders.length,
          pendingOrders: orders.filter((o) => o.status === 'pendiente').length,
          revenue: orders.reduce((sum, o) => sum + o.total, 0),
        });
      } catch {
        setStats({ products: 0, activeProducts: 0, orders: 0, pendingOrders: 0, revenue: 0 });
      }
    })();
  }, []);

  const cards = [
    { label: 'Productos activos', value: stats ? `${stats.activeProducts}/${stats.products}` : '—' },
    { label: 'Pedidos totales', value: stats ? stats.orders : '—' },
    { label: 'Pedidos pendientes', value: stats ? stats.pendingOrders : '—' },
    { label: 'Ventas totales', value: stats ? formatPrice(stats.revenue) : '—' },
  ];

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Panel de control</h1>
      <p className="mb-8 text-sm text-muted">Resumen general de tu tienda</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/productos/nuevo" className="btn-primary">
          + Agregar producto
        </Link>
        <Link href="/admin/pedidos" className="btn-secondary">
          Ver pedidos
        </Link>
      </div>
    </div>
  );
}
