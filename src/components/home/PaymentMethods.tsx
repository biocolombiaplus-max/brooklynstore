'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/lib/settings-context';
import { formatPrice } from '@/lib/utils';

// Explica los dos únicos métodos de pago con números claros — es lo que más
// dudas genera antes de comprar en línea en Ecuador, así que va bien visible.
export default function PaymentMethods() {
  const { payments, shipping } = useSiteSettings();
  const banks = Array.from(new Set(payments.bankAccounts.map((b) => b.bank).filter(Boolean)));

  return (
    <section id="formas-de-pago" className="scroll-mt-24 bg-ink py-16 text-white sm:py-24">
      <div className="container-page">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-primary-light">Formas de pago</p>
          <h2 className="mt-2 font-heading text-3xl font-black uppercase sm:text-5xl">
            Paga como <span className="text-gold-gradient">te quede mejor</span>
          </h2>
          <p className="mt-4 text-sm text-white/70 sm:text-base">
            Sin tarjetas, sin complicaciones. Tú eliges y confirmamos todo contigo por WhatsApp.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-primary/50 bg-gradient-to-br from-white/10 to-white/[0.02] p-7 sm:p-9">
            <span className="absolute right-5 top-5 rounded-full bg-gold-gradient px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-ink">
              {shipping.defaultRate === 0 ? 'Envío gratis' : 'Recomendado'}
            </span>
            <span className="text-4xl">🏦</span>
            <h3 className="mt-4 text-2xl font-black uppercase">Transferencia o depósito</h3>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-light">Depósitos solo en Banco Pichincha</p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">
              Transfiere desde la app de tu banco o deposita en Banco Pichincha (ventanilla o agente Pichincha Mi Vecino). Nos mandas la foto
              del comprobante por WhatsApp y despachamos ese mismo día.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>✅ {shipping.defaultRate === 0 ? 'Envío GRATIS a todo el Ecuador' : `Envío desde ${formatPrice(shipping.defaultRate)}`}</li>
              <li>✅ Despacho el mismo día</li>
              <li>✅ Pagas una sola vez y listo</li>
            </ul>
            {banks.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {banks.map((b) => (
                  <span key={b} className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold ring-1 ring-white/15">
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>

          {payments.codEnabled && (
            <div className="relative overflow-hidden rounded-3xl bg-gold-gradient p-7 text-ink sm:p-9">
              <span className="absolute right-5 top-5 rounded-full bg-ink px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-light">
                Más confianza
              </span>
              <span className="text-4xl">💵</span>
              <h3 className="mt-4 text-2xl font-black uppercase">Pago contra entrega</h3>
              <p className="mt-3 text-sm font-medium leading-relaxed text-ink/80">
                Solo adelantas <strong>{formatPrice(payments.codAdvance)}</strong> por transferencia o depósito en Banco Pichincha, que es el valor del
                envío. <strong>El resto lo pagas en efectivo cuando recibes tus zapatos</strong> en la dirección que nos indiques.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-ink/90 p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary-light">Hoy adelantas</p>
                  <p className="mt-1 text-3xl font-black">{formatPrice(payments.codAdvance)}</p>
                  <p className="text-[11px] text-white/70">del envío</p>
                </div>
                <div className="rounded-2xl bg-white/70 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink/70">Al recibir pagas</p>
                  <p className="mt-1 text-3xl font-black">El resto</p>
                  <p className="text-[11px] text-ink/70">en efectivo</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link href="/catalogo" className="btn-primary btn-shine">
            Elegir mis zapatos →
          </Link>
        </div>
      </div>
    </section>
  );
}
