'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllProducts } from '@/lib/products';
import { getAllOrders } from '@/lib/orders';
import { getSiteSettings, updateSiteSettingsFields } from '@/lib/settings';
import { formatPrice } from '@/lib/utils';
import CommissionBar from '@/components/admin/CommissionBar';
import type { Order, Product } from '@/lib/types';

// Pedidos que cuentan como venta (los pendientes aún no han pagado).
const SOLD = new Set(['confirmado', 'enviado', 'entregado']);

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [allOrders, setAllOrders] = useState<Order[] | null>(null);
  const [since, setSince] = useState<number | null>(null);
  const [paid, setPaid] = useState<string[]>([]);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    (async () => {
      const [p, o, s] = await Promise.all([
        getAllProducts().catch(() => [] as Product[]),
        getAllOrders().catch(() => [] as Order[]),
        getSiteSettings().catch(() => null),
      ]);
      setProducts(p);
      setAllOrders(o);
      setSince(s?.statsResetAt ?? Date.now());
      setPaid(s?.commissionPaid ?? []);
    })();
  }, []);

  // Solo cuentan los pedidos desde el inicio oficial (lo anterior fueron pruebas).
  const orders = allOrders && since !== null ? allOrders.filter((o) => o.createdAt >= since) : null;
  const live = orders?.filter((o) => o.status !== 'cancelado') ?? [];
  const sold = live.filter((o) => SOLD.has(o.status));
  const revenue = sold.reduce((sum, o) => sum + o.total, 0);
  const pendingRevenue = live.filter((o) => o.status === 'pendiente').reduce((sum, o) => sum + o.total, 0);
  const pairsSold = sold.reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity || 1), 0), 0);

  const cards = [
    { label: 'Productos activos', value: products ? `${products.filter((p) => p.active).length}/${products.length}` : '—' },
    { label: 'Pedidos', value: orders ? live.length : '—', hint: orders ? `${sold.length} confirmados` : '' },
    { label: 'Pedidos pendientes', value: orders ? live.length - sold.length : '—', hint: orders && pendingRevenue ? `${formatPrice(pendingRevenue)} por cobrar` : '' },
    { label: 'Ventas confirmadas', value: orders ? formatPrice(revenue) : '—', hint: orders ? `${pairsSold} ${pairsSold === 1 ? 'par vendido' : 'pares vendidos'}` : '' },
  ];

  async function resetStats() {
    if (!window.confirm('¿Reiniciar el panel en cero desde ahora?\n\nLos pedidos NO se borran: siguen en la sección Pedidos. Solo dejan de contar en estas cifras y en la ganancia de Juan Carlos.')) return;
    setResetting(true);
    const now = Date.now();
    try {
      await updateSiteSettingsFields({ statsResetAt: now, commissionPaid: [] });
      setSince(now);
      setPaid([]);
    } catch {
      alert('No se pudo reiniciar. Intenta de nuevo.');
    } finally {
      setResetting(false);
    }
  }

  async function togglePaid(key: string, value: boolean) {
    const next = value ? Array.from(new Set([...paid, key])) : paid.filter((k) => k !== key);
    await updateSiteSettingsFields({ commissionPaid: next });
    setPaid(next);
  }

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Panel de control</h1>
          <p className="text-sm text-muted">
            Resumen de tu tienda
            {since !== null && <> · desde el {new Date(since).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
          </p>
        </div>
        <button
          type="button"
          onClick={resetStats}
          disabled={resetting || since === null}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-muted ring-1 ring-border transition-colors hover:text-ink disabled:opacity-60"
        >
          {resetting ? 'Reiniciando...' : '↺ Reiniciar en cero'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-card bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink">{c.value}</p>
            {c.hint && <p className="mt-1 text-xs text-muted">{c.hint}</p>}
          </div>
        ))}
      </div>

      {since !== null && <CommissionBar orders={orders} since={since} paid={paid} onTogglePaid={togglePaid} />}

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
