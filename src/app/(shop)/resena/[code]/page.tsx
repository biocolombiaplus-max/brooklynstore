'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SafeImage from '@/components/SafeImage';
import { daysLeft, expiryLabel, getLoyalty, submitLoyaltyReviews } from '@/lib/loyalty';
import { classNames } from '@/lib/utils';
import type { LoyaltyRecord, LoyaltyReview } from '@/lib/types';

const FITS: { value: NonNullable<LoyaltyReview['fit']>; label: string }[] = [
  { value: 'pequena', label: 'Me quedó pequeño' },
  { value: 'perfecta', label: 'Talla perfecta' },
  { value: 'grande', label: 'Me quedó grande' },
];
const RATING_LABELS = ['', 'No me gustó', 'Regular', 'Bueno', 'Muy bueno', '¡Me encantó!'];

export default function ReviewPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? '').toUpperCase();
  const [record, setRecord] = useState<LoyaltyRecord | null | undefined>(undefined);
  const [reviews, setReviews] = useState<LoyaltyReview[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getLoyalty(code)
      .then((r) => {
        setRecord(r);
        if (r) setReviews(r.items.map((i) => ({ productId: i.productId, rating: 0, text: '' })));
      })
      .catch(() => setRecord(null));
  }, [code]);

  if (record === undefined) return <div className="container-page py-24 text-center text-muted">Cargando...</div>;
  if (record === null) {
    return (
      <div className="container-page py-24 text-center">
        <p className="section-title">Este link no es válido</p>
        <p className="mt-3 text-sm text-muted">Revisa que lo hayas copiado completo o escríbenos por WhatsApp.</p>
        <Link href="/catalogo" className="btn-primary mt-8">
          Ver catálogo
        </Link>
      </div>
    );
  }

  const done = sent || record.reviewStatus !== 'pendiente';
  const update = (i: number, patch: Partial<LoyaltyReview>) => setReviews((list) => list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  async function submit() {
    setError('');
    const rated = reviews.filter((r) => r.rating > 0);
    if (!rated.length) {
      setError('Toca las estrellas para calificar, porfa 🙏');
      return;
    }
    setSending(true);
    try {
      await submitLoyaltyReviews(
        record!.code,
        rated.map((r) => ({ productId: r.productId, rating: r.rating, text: r.text.trim().slice(0, 600), ...(r.fit ? { fit: r.fit } : {}) })),
      );
      setSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('No pudimos enviar tu reseña. Intenta otra vez en un momento.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-cream-alt/50">
      <div className="container-page max-w-xl py-8 sm:py-12">
        {done ? <ThankYou record={record} /> : (
          <>
            <div className="text-center">
              <p className="section-eyebrow">⭐ Tu opinión vale oro</p>
              <h1 className="mt-2 font-heading text-3xl font-black uppercase text-ink">¿Qué tal tus zapatos, {record.customerName}?</h1>
              <p className="mt-2 text-sm text-muted">
                Te toma 30 segundos. Al enviarla te regalamos <strong className="text-ink">{record.couponPercent}% OFF</strong> en tu próxima compra.
              </p>
            </div>

            <div className="mt-6 space-y-4">
              {record.items.map((item, i) => {
                const r = reviews[i];
                if (!r) return null;
                return (
                  <div key={`${item.productId}-${i}`} className="rounded-3xl bg-white p-5 shadow-soft">
                    <div className="flex items-center gap-3">
                      <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream-alt">
                        {item.image && <SafeImage src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-ink">{item.title}</span>
                        <span className="block text-xs text-muted">
                          Talla {item.size}
                          {item.color && ` · ${item.color}`}
                        </span>
                      </span>
                    </div>

                    <div className="mt-4 text-center">
                      <div className="flex justify-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            aria-label={`${n} estrellas`}
                            onClick={() => update(i, { rating: n })}
                            className={classNames('text-4xl leading-none transition-transform active:scale-90', n <= r.rating ? 'text-primary' : 'text-border')}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <p className="mt-1 h-4 text-xs font-bold text-ink">{RATING_LABELS[r.rating]}</p>
                    </div>

                    <p className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-muted">¿Cómo te quedó la talla?</p>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {FITS.map((f) => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => update(i, { fit: r.fit === f.value ? undefined : f.value })}
                          className={classNames(
                            'rounded-xl px-2 py-2.5 text-[11px] font-bold leading-tight transition-all',
                            r.fit === f.value ? 'bg-ink text-white' : 'bg-cream-alt text-ink hover:bg-border',
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={r.text}
                      onChange={(e) => update(i, { text: e.target.value })}
                      rows={3}
                      maxLength={600}
                      placeholder="Cuéntanos qué te gustó (opcional): comodidad, calidad, el envío..."
                      className="input mt-4 w-full resize-none text-sm"
                    />
                  </div>
                );
              })}
            </div>

            {error && <p className="mt-4 rounded-xl bg-urgent/10 p-3 text-center text-sm font-semibold text-urgent">{error}</p>}
            <button type="button" onClick={submit} disabled={sending} className="btn-primary btn-shine mt-5 w-full py-5 text-base">
              {sending ? 'Enviando...' : `Enviar y recibir mi ${record.couponPercent}% OFF 🎁`}
            </button>
            <p className="mt-3 text-center text-[11px] text-muted">Publicamos tu nombre y ciudad junto a tu reseña como compra verificada.</p>
          </>
        )}
      </div>
    </div>
  );
}

function ThankYou({ record }: { record: LoyaltyRecord }) {
  const [copied, setCopied] = useState(false);
  const left = daysLeft(record);
  const active = !record.couponUsed && left > 0;
  return (
    <div className="text-center">
      <div className="mx-auto flex h-20 w-20 animate-popIn items-center justify-center rounded-full bg-gold-gradient text-4xl shadow-lift">💛</div>
      <h1 className="mt-5 font-heading text-3xl font-black uppercase text-ink">¡Gracias, {record.customerName}!</h1>
      <p className="mt-2 text-sm text-muted">Tu reseña nos ayuda muchísimo a seguir creciendo.</p>

      {active ? (
        <div className="relative mt-6 overflow-hidden rounded-3xl bg-[#0a0a0a] p-6 text-white shadow-dark ring-1 ring-primary/40">
          <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.35),transparent_70%)]" />
          <p className="relative text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary-light">Tu regalo</p>
          <p className="relative mt-1 text-5xl font-black">{record.couponPercent}% OFF</p>
          <p className="relative mt-1 text-xs text-white/60">En tu próxima compra pagando por transferencia o depósito</p>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard
                ?.writeText(record.code)
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => {})
            }
            className="relative mx-auto mt-4 block rounded-2xl border border-dashed border-primary/60 px-5 py-3 font-mono text-lg font-black tracking-wider"
          >
            {record.code}
            <span className="mt-0.5 block font-sans text-[10px] font-bold uppercase tracking-wider text-primary-light">
              {copied ? '✓ Copiado' : 'Toca para copiar'}
            </span>
          </button>
          <p className="relative mt-3 text-xs text-white/60">
            Válido hasta el <strong className="text-white">{expiryLabel(record)}</strong> · {left} {left === 1 ? 'día' : 'días'}
          </p>
          <Link href={`/catalogo?cupon=${encodeURIComponent(record.code)}`} className="btn-primary btn-shine relative mt-5 w-full py-4">
            🛍️ Ver catálogo con mi descuento
          </Link>
        </div>
      ) : (
        <Link href="/catalogo" className="btn-primary mt-8">
          Ver catálogo
        </Link>
      )}
    </div>
  );
}
