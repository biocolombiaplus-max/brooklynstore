'use client';

import type { Order } from '@/lib/types';

// Comisión de Juan Carlos: 5.000 pesos por cada par vendido (un pedido de
// varios pares suma 5.000 por par). Se liquida por quincenas: del 1 al 15 y
// del 16 al último día del mes. Los pedidos cancelados no cuentan.
export const COMMISSION_PER_PAIR = 5000;
const COMMISSION_NAME = 'Juan Carlos';

const cop = (n: number) => `$${new Intl.NumberFormat('es-CO').format(n)}`;
const dayLabel = (d: Date) => d.toLocaleDateString('es-EC', { day: 'numeric', month: 'short' });

function quincena(date: Date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const first = date.getDate() <= 15;
  const start = new Date(y, m, first ? 1 : 16);
  const end = first ? new Date(y, m, 15, 23, 59, 59, 999) : new Date(y, m + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function pairsBetween(orders: Order[], start: Date, end: Date) {
  return orders
    .filter((o) => o.status !== 'cancelado' && o.createdAt >= start.getTime() && o.createdAt <= end.getTime())
    .reduce((sum, o) => sum + o.items.reduce((s, i) => s + (i.quantity || 1), 0), 0);
}

export default function CommissionBar({ orders, now = new Date() }: { orders: Order[] | null; now?: Date }) {
  const current = quincena(now);
  const previous = quincena(new Date(current.start.getTime() - 1));
  const pairs = orders ? pairsBetween(orders, current.start, current.end) : 0;
  const prevPairs = orders ? pairsBetween(orders, previous.start, previous.end) : 0;
  const totalDays = Math.round((current.end.getTime() - current.start.getTime()) / 86400000);
  const elapsed = Math.min(totalDays, Math.max(1, Math.ceil((now.getTime() - current.start.getTime()) / 86400000)));
  const daysLeft = totalDays - elapsed;
  const progress = Math.round((elapsed / totalDays) * 100);

  return (
    <div className="relative mt-6 overflow-hidden rounded-card bg-[#0a0a0a] p-5 text-white shadow-soft ring-1 ring-primary/40 sm:p-6">
      <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.3),transparent_70%)]" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary-light">💼 Ganancia de {COMMISSION_NAME}</p>
          <p className="mt-1 text-3xl font-black sm:text-4xl">
            {orders ? cop(pairs * COMMISSION_PER_PAIR) : '—'} <span className="text-sm font-bold text-white/50">COP</span>
          </p>
          <p className="mt-1 text-xs text-white/60">
            {orders ? `${pairs} ${pairs === 1 ? 'par' : 'pares'}` : '—'} × {cop(COMMISSION_PER_PAIR)} · quincena del {dayLabel(current.start)} al{' '}
            {dayLabel(current.end)}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Se cobra el</p>
          <p className="text-lg font-black text-primary-light">{dayLabel(current.end)}</p>
          <p className="text-[11px] text-white/50">{daysLeft === 0 ? '¡Hoy es día de pago!' : `Faltan ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}`}</p>
        </div>
      </div>
      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gold-gradient transition-all" style={{ width: `${progress}%` }} />
      </div>
      <div className="relative mt-3 flex flex-wrap justify-between gap-2 text-[11px] text-white/55">
        <span>
          Quincena anterior ({dayLabel(previous.start)} – {dayLabel(previous.end)}):{' '}
          <strong className="text-white">{orders ? `${cop(prevPairs * COMMISSION_PER_PAIR)} · ${prevPairs} ${prevPairs === 1 ? 'par' : 'pares'}` : '—'}</strong>
        </span>
        <span>No cuenta pedidos cancelados</span>
      </div>
    </div>
  );
}
