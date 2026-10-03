'use client';

import { useEffect, useState } from 'react';
import {
  approveLoyaltyReviews,
  buildReminderMessage,
  couponCatalogUrl,
  daysLeft,
  expiryLabel,
  listLoyalty,
  markReminderSent,
  reminderDue,
  reviewUrl,
  setReviewStatus,
  LOYALTY_DAYS,
  REMINDER_DAY,
} from '@/lib/loyalty';
import { classNames, whatsappLinkTo } from '@/lib/utils';
import type { LoyaltyRecord } from '@/lib/types';

type Tab = 'recordar' | 'resenas' | 'cupones';

const FIT_LABEL = { pequena: 'Le quedó pequeño', perfecta: 'Talla perfecta', grande: 'Le quedó grande' } as const;

export default function LoyaltyCrmPage() {
  const [records, setRecords] = useState<LoyaltyRecord[] | null>(null);
  const [tab, setTab] = useState<Tab>('recordar');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setRecords(await listLoyalty());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar. ¿Publicaste las reglas de Firestore?');
      setRecords([]);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const list = records ?? [];
  const toRemind = list.filter(reminderDue);
  const toApprove = list.filter((r) => r.reviewStatus === 'enviada');
  const used = list.filter((r) => r.couponUsed).length;
  const reviewed = list.filter((r) => r.reviewStatus !== 'pendiente').length;

  const stats = [
    { label: 'Clientes fidelizados', value: list.length },
    { label: 'Reseñas recibidas', value: `${reviewed}${list.length ? ` · ${Math.round((reviewed / list.length) * 100)}%` : ''}` },
    { label: 'Cupones usados (recompra)', value: `${used}${list.length ? ` · ${Math.round((used / list.length) * 100)}%` : ''}` },
    { label: `Recordatorios del día ${REMINDER_DAY}`, value: toRemind.length, hot: toRemind.length > 0 },
  ];

  async function run(code: string, fn: () => Promise<void>) {
    setBusy(code);
    try {
      await fn();
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo completar.');
    } finally {
      setBusy('');
    }
  }

  const shown = tab === 'recordar' ? toRemind : tab === 'resenas' ? toApprove : list;

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">⭐ Fidelización</h1>
      <p className="mb-6 text-sm text-muted">
        Reseñas reales + {LOYALTY_DAYS} días de 10% OFF pagando por transferencia. El botón “Pedir reseña” aparece en cada pedido entregado.
      </p>

      {error && <p className="mb-4 rounded-xl bg-urgent/10 p-3 text-sm font-semibold text-urgent">{error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={classNames('rounded-card p-5 shadow-soft', s.hot ? 'bg-ink text-white' : 'bg-white')}>
            <p className={classNames('text-xs font-semibold uppercase tracking-wide', s.hot ? 'text-primary-light' : 'text-muted')}>{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{records ? s.value : '—'}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ['recordar', `⏰ Recordar hoy (${toRemind.length})`],
            ['resenas', `📝 Reseñas por aprobar (${toApprove.length})`],
            ['cupones', `🎟️ Todos los clientes (${list.length})`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={classNames('rounded-full px-4 py-2 text-sm font-bold transition-colors', tab === key ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-border')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {records === null && <p className="text-sm text-muted">Cargando...</p>}
        {records && shown.length === 0 && (
          <p className="rounded-card bg-white p-6 text-center text-sm text-muted shadow-soft">
            {tab === 'recordar' ? '¡Al día! No hay recordatorios para hoy.' : tab === 'resenas' ? 'No hay reseñas nuevas por aprobar.' : 'Aún no hay clientes. Pide una reseña desde un pedido entregado.'}
          </p>
        )}
        {shown.map((r) => (
          <LoyaltyCard key={r.code} record={r} busy={busy === r.code} onRun={(fn) => run(r.code, fn)} />
        ))}
      </div>
    </div>
  );
}

function LoyaltyCard({ record: r, busy, onRun }: { record: LoyaltyRecord; busy: boolean; onRun: (fn: () => Promise<void>) => void }) {
  const left = daysLeft(r);
  const coupon = r.couponUsed
    ? { text: `✓ Usado en ${r.couponUsedOrder ?? 'un pedido'}`, cls: 'bg-whatsapp/15 text-whatsapp' }
    : left <= 0
    ? { text: 'Vencido', cls: 'bg-border text-muted' }
    : { text: `${left} ${left === 1 ? 'día' : 'días'} · vence ${expiryLabel(r)}`, cls: left <= 2 ? 'bg-urgent/10 text-urgent' : 'bg-gold-50 text-ink' };
  const reviewBadge = {
    pendiente: { text: 'Sin reseña', cls: 'bg-cream-alt text-muted' },
    enviada: { text: 'Reseña por aprobar', cls: 'bg-primary/20 text-ink' },
    aprobada: { text: '✓ Reseña publicada', cls: 'bg-whatsapp/15 text-whatsapp' },
    oculta: { text: 'Reseña oculta', cls: 'bg-border text-muted' },
  }[r.reviewStatus];

  return (
    <div className="rounded-card bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink">
            {r.customerName} <span className="font-normal text-muted">· {r.city} · {r.orderNumber}</span>
          </p>
          <p className="mt-0.5 font-mono text-xs text-muted">{r.code}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className={classNames('rounded-full px-3 py-1', reviewBadge.cls)}>{reviewBadge.text}</span>
          <span className={classNames('rounded-full px-3 py-1', coupon.cls)}>🎟️ {coupon.text}</span>
          {r.reminderSentAt && <span className="rounded-full bg-cream-alt px-3 py-1 text-muted">⏰ Recordado</span>}
        </div>
      </div>

      {r.reviews && r.reviews.length > 0 && (
        <div className="mt-3 space-y-2">
          {r.reviews.map((rev, i) => {
            const item = r.items.find((it) => it.productId === rev.productId);
            return (
              <div key={i} className="rounded-xl bg-cream-alt/60 p-3 text-sm">
                <p className="font-bold text-ink">
                  <span className="text-primary">{'★'.repeat(rev.rating)}</span>
                  <span className="text-border">{'★'.repeat(5 - rev.rating)}</span> {item?.title}
                  {rev.fit && <span className="ml-2 text-xs font-semibold text-muted">· {FIT_LABEL[rev.fit]}</span>}
                </p>
                {rev.text && <p className="mt-1 text-ink">&ldquo;{rev.text}&rdquo;</p>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {r.reviewStatus === 'enviada' && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => onRun(() => approveLoyaltyReviews(r))}
              className="rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              ✓ Publicar en la tienda
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onRun(() => setReviewStatus(r.code, 'oculta'))}
              className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-ink ring-1 ring-border disabled:opacity-60"
            >
              Ocultar
            </button>
          </>
        )}
        {!r.couponUsed && left > 0 && (
          <a
            href={whatsappLinkTo(r.phone, buildReminderMessage(r))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onRun(() => markReminderSent(r.code))}
            className={classNames(
              'rounded-lg px-4 py-2.5 text-sm font-bold text-white',
              reminderDue(r) ? 'bg-whatsapp' : 'bg-whatsapp/70',
            )}
          >
            ⏰ {r.reminderSentAt ? 'Recordar otra vez' : 'Enviar recordatorio'}
          </a>
        )}
        <button
          type="button"
          onClick={() => navigator.clipboard?.writeText(r.reviewStatus === 'pendiente' ? reviewUrl(r.code) : couponCatalogUrl(r.code)).catch(() => {})}
          className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-ink ring-1 ring-border"
        >
          🔗 Copiar link {r.reviewStatus === 'pendiente' ? 'de reseña' : 'con descuento'}
        </button>
      </div>
    </div>
  );
}
