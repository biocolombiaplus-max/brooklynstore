'use client';

import { useEffect, useState } from 'react';
import { getActiveCoupon, redeemAnyCouponCode, type WonCoupon } from '@/lib/coupon';

// Activa el cupón que viene en el link (?cupon=GRACIAS-...) y lo muestra
// con un aviso elegante. En el checkout se aplica solo.
export default function CouponActivator() {
  const [coupon, setCoupon] = useState<WonCoupon | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('cupon');
    if (!code) return;
    const current = getActiveCoupon();
    if (current && current.code === code.trim().toUpperCase()) {
      setCoupon(current);
      setOpen(true);
      return;
    }
    redeemAnyCouponCode(code).then(({ coupon: c, error: e }) => {
      if (c) setCoupon(c);
      else setError(e ?? 'Ese cupón no es válido.');
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => setOpen(false), 9000);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const until = coupon ? new Date(coupon.expiresAt).toLocaleDateString('es-EC', { day: 'numeric', month: 'long' }) : '';

  return (
    <div className="fixed inset-x-3 top-3 z-[70] mx-auto max-w-md animate-slideUp sm:top-5">
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] p-4 pr-10 text-white shadow-dark ring-1 ring-primary/50">
        <span className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.35),transparent_70%)]" />
        {coupon ? (
          <div className="relative flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-xl font-black text-ink">
              {coupon.percent}%
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-wide">🎁 ¡Tu {coupon.percent}% OFF está activado!</p>
              <p className="text-xs text-white/70">
                {coupon.onlyMethod === 'transferencia' ? 'Pagando por transferencia o depósito · ' : ''}válido hasta el {until}. Se aplica solo al pagar.
              </p>
            </div>
          </div>
        ) : (
          <p className="relative text-sm font-bold">😕 {error}</p>
        )}
        <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 text-white/60 hover:text-white" aria-label="Cerrar">
          ✕
        </button>
      </div>
    </div>
  );
}
