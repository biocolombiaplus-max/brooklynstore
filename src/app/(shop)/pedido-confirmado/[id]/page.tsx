'use client';

import ExchangePolicy from '@/components/ExchangePolicy';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getLocalOrder, getOrderById } from '@/lib/orders';
import { bankAccountText, buildOrderWhatsAppMessage, classNames, formatPrice, paymentMethodLabel, whatsappLinkTo } from '@/lib/utils';
import { useSiteSettings } from '@/lib/settings-context';
import PostPurchaseUpsell from '@/components/product/PostPurchaseUpsell';
import { WhatsAppIcon } from '@/components/icons';
import type { BankAccount, Order } from '@/lib/types';

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    // Respaldo para navegadores sin portapapeles moderno.
    const area = document.createElement('textarea');
    area.value = value;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

function CopyButton({ value, label = 'Copiar', className }: { value: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() =>
        copyText(value).then((ok) => {
          if (!ok) return;
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        })
      }
      className={classNames(
        'shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider transition-all active:scale-95',
        copied ? 'bg-whatsapp text-white' : 'bg-white/10 text-primary-light ring-1 ring-primary/40 hover:bg-primary hover:text-ink',
        className,
      )}
    >
      {copied ? '✓ Copiado' : label}
    </button>
  );
}

function DataRow({ label, value, copy, big = false }: { label: string; value: string; copy?: string; big?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/10 py-3">
      <span className="min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{label}</span>
        <span className={classNames('block break-words font-black', big ? 'font-mono text-2xl tracking-wider text-white sm:text-[28px]' : 'text-[15px] text-white')}>
          {value}
        </span>
      </span>
      {copy !== undefined && <CopyButton value={copy} />}
    </div>
  );
}

// Tarjeta premium con los datos para transferir: cada dato se copia con un
// toque y "Copiar todo" deja listo el texto para pegar en la app del banco.
function BankCard({ account, amount }: { account: BankAccount; amount: number }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] p-5 text-white shadow-dark ring-1 ring-primary/40 sm:p-6">
      <span className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.35),transparent_70%)]" />
      <div className="relative flex items-center justify-between gap-3 pb-3">
        <span className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFDD00] text-sm font-black text-[#0F265C]">P</span>
          <span>
            <span className="block text-sm font-black uppercase tracking-wide">{account.bank}</span>
            <span className="block text-[11px] text-white/55">{account.type}</span>
          </span>
        </span>
        <span className="shrink-0 whitespace-nowrap rounded-full bg-gold-gradient px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-ink">Cuenta oficial</span>
      </div>
      <div className="relative">
        <DataRow label="Número de cuenta" value={account.number} copy={account.number} big />
        <DataRow label="Titular" value={account.holder} copy={account.holder} />
        {account.idNumber && <DataRow label="Cédula" value={account.idNumber} copy={account.idNumber} />}
        <DataRow label="Valor a pagar" value={formatPrice(amount)} copy={amount.toFixed(2)} />
      </div>
      <CopyButton
        value={bankAccountText(account, amount)}
        label="📋 Copiar todos los datos"
        className="relative mt-3 w-full py-3 text-[11px]"
      />
    </div>
  );
}

type Phase = 'pagar' | 'comprobante' | 'listo';

const sentKey = (id: string) => `bs-comprobante-${id}`;

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const { whatsappCountryCode, whatsappNumber, payments, shipping, footer } = useSiteSettings();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);
  const [phase, setPhase] = useState<Phase>('pagar');
  // Recordatorio suave si se queda en la página sin enviar el comprobante.
  const [nudge, setNudge] = useState(false);
  const [returned, setReturned] = useState(false);

  useEffect(() => {
    const local = getLocalOrder(params.id);
    if (local) {
      setOrder(local);
      return;
    }
    let cancelled = false;
    getOrderById(params.id)
      .then((o) => !cancelled && setOrder(o))
      .catch(() => !cancelled && setOrder(null));
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    try {
      if (localStorage.getItem(sentKey(params.id))) setPhase('listo');
    } catch {
      /* sin almacenamiento: empieza en el paso de pago */
    }
  }, [params.id]);

  // Si sale a la app del banco y vuelve, le mostramos de una el botón de
  // enviar el comprobante. Mientras está en otra pestaña, el título le
  // recuerda que falta ese paso.
  useEffect(() => {
    if (phase === 'listo') return;
    const original = document.title;
    let hiddenAt = 0;
    function onVisibility() {
      if (document.hidden) {
        hiddenAt = Date.now();
        document.title = '⏰ Envía tu comprobante · Brooklyn Store';
      } else {
        document.title = original;
        if (hiddenAt && Date.now() - hiddenAt > 4000) {
          setReturned(true);
          setPhase('comprobante');
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setTimeout(() => setNudge(true), 75_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearTimeout(timer);
      document.title = original;
    };
  }, [phase]);

  // Pantalla de comprobante: sin scroll de fondo.
  useEffect(() => {
    if (phase !== 'comprobante') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  if (order === undefined) {
    return <div className="container-page py-24 text-center text-muted">Cargando tu pedido...</div>;
  }

  if (order === null) {
    return (
      <div className="container-page py-24 text-center">
        <p className="section-title">No encontramos ese pedido</p>
        <p className="mt-3 text-sm text-muted">Si ya lo confirmaste por WhatsApp, tranquilo: lo tenemos registrado.</p>
        <Link href="/" className="btn-primary mt-8">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const firstName = order.customer.name.split(' ')[0];
  const isCod = order.paymentMethod === 'contra_entrega';
  const paidMessage = buildOrderWhatsAppMessage(order, { paid: true });
  const unpaidMessage = buildOrderWhatsAppMessage(order);
  const sendUrl = whatsappLinkTo(whatsappNumber, paidMessage, whatsappCountryCode);

  function markSent() {
    try {
      localStorage.setItem(sentKey(params.id), String(Date.now()));
    } catch {
      /* no pasa nada */
    }
    setNudge(false);
    // Se deja abrir WhatsApp y luego pasamos a "listo".
    setTimeout(() => setPhase('listo'), 400);
  }

  return (
    <div className="bg-cream-alt/50 pb-28">
      <div className="container-page max-w-3xl py-6 sm:py-10">
        {/* Encabezado según el paso */}
        {phase === 'listo' ? (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 animate-popIn items-center justify-center rounded-full bg-gold-gradient text-4xl text-ink shadow-lift">✓</div>
            <h1 className="mt-5 font-heading text-3xl font-black uppercase text-ink sm:text-4xl">¡Gracias, {firstName}!</h1>
            <p className="mt-2 text-muted">
              Recibimos tu pedido <strong className="text-ink">{order.orderNumber}</strong> y tu comprobante. Apenas lo validamos despachamos con
              Servientrega y te enviamos tu guía. Llega en {shipping.deliveryTime}.
            </p>
            <a
              href={sendUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-muted underline decoration-whatsapp decoration-2 underline-offset-4"
            >
              <WhatsAppIcon size={14} /> ¿No se envió el comprobante? Envíalo otra vez
            </a>
          </div>
        ) : (
          <>
            <Stepper />
            <div className="mt-5 text-center">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary-dark">Pedido {order.orderNumber} reservado ✓</p>
              <h1 className="mt-1 font-heading text-2xl font-black uppercase text-ink sm:text-3xl">
                {firstName}, haz tu pago de <span className="text-gold-gradient">{formatPrice(order.payNow)}</span>
              </h1>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted">
                {isCod ? (
                  <>
                    Es el envío y garantiza tu pedido. Tus zapatos (<strong className="text-ink">{formatPrice(order.payOnDelivery)}</strong>) los pagas
                    en efectivo al recibir.
                  </>
                ) : (
                  'Desde la app de tu banco o en ventanilla / Pichincha Mi Vecino. Toca “Copiar” y pega en tu banco.'
                )}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {payments.bankAccounts.map((account) => (
                <BankCard key={account.bank + account.number} account={account} amount={order.payNow} />
              ))}
            </div>

            {isCod && (
              <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl bg-gold-50 p-3 ring-1 ring-primary/30">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Pagas hoy</p>
                  <p className="text-2xl font-black text-ink">{formatPrice(order.payNow)}</p>
                </div>
                <div className="rounded-2xl bg-white p-3 ring-1 ring-border">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Al recibir</p>
                  <p className="text-2xl font-black text-ink">{formatPrice(order.payOnDelivery)}</p>
                </div>
              </div>
            )}

            <button type="button" onClick={() => setPhase('comprobante')} className="btn-whatsapp btn-shine mt-4 w-full py-5 text-base">
              ✓ Ya hice el pago · Enviar comprobante
            </button>
            <p className="mt-3 text-center text-[11px] text-muted">🔒 Esta es nuestra única cuenta oficial. Nunca te pediremos pagar a otra.</p>
            <p className="mt-2 text-center text-[11px] text-muted">
              ¿No puedes pagar ahora?{' '}
              <a
                href={whatsappLinkTo(whatsappNumber, unpaidMessage, whatsappCountryCode)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-ink underline"
              >
                Envíanos tu pedido y pagas luego
              </a>
            </p>
          </>
        )}

        {/* Resumen */}
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-soft sm:p-7">
          <h2 className="text-sm font-black uppercase text-ink">Resumen del pedido</h2>
          <ul className="mt-4 space-y-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-3 text-sm">
                <span>
                  <span className="font-bold text-ink">{item.title}</span> × {item.quantity}
                  <span className="block text-xs text-muted">
                    Talla {item.size}
                    {item.sizeUs && ` (US ${item.sizeUs})`}
                    {item.color && ` · ${item.color}`}
                  </span>
                </span>
                <span className="font-bold text-ink">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-sm text-muted">
            {!!order.discount && (
              <div className="flex justify-between">
                <span>Descuento {order.couponCode && `(${order.couponCode})`}</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Envío</span>
              <span>{order.shipping === 0 ? 'Sin costo' : formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-black text-ink">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <p className="pt-1 text-xs">{paymentMethodLabel(order.paymentMethod)}</p>
          </div>
          <div className="mt-4 border-t border-border pt-3 text-sm text-muted">
            <p className="font-bold text-ink">📍 Entrega</p>
            <p>
              {order.customer.name} · {order.customer.phone}
            </p>
            <p>
              {order.customer.address}, {order.customer.city}, {order.customer.province}
            </p>
            {order.customer.reference && <p>Referencia: {order.customer.reference}</p>}
          </div>
        </div>

        <ExchangePolicy compact className="mt-4" />

        <p className="mt-6 text-center text-xs text-muted">
          ¿Alguna duda? Escríbenos por WhatsApp o al correo{' '}
          <a href={`mailto:${footer.email}`} className="font-bold text-ink underline">
            {footer.email}
          </a>
        </p>

        <div className="mt-8 text-center">
          <Link href="/catalogo" className="text-sm font-bold text-ink underline decoration-primary decoration-2 underline-offset-4">
            ← Seguir comprando
          </Link>
        </div>

        <PostPurchaseUpsell excludeProductIds={order.items.map((i) => i.productId)} />
      </div>

      {/* Barra fija: el siguiente paso siempre a la mano */}
      {phase === 'pagar' && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="min-w-0 flex-1 text-white">
              <span className={classNames('block text-[10px] font-extrabold uppercase tracking-[0.18em]', nudge ? 'text-primary-light' : 'text-white/50')}>
                {nudge ? '⏰ No olvides este paso' : `Paga ${formatPrice(order.payNow)} y luego`}
              </span>
              <span className="block truncate text-sm font-black">Envía tu comprobante para confirmar</span>
            </span>
            <button
              type="button"
              onClick={() => setPhase('comprobante')}
              className={classNames('btn-whatsapp shrink-0 px-5 py-3 text-sm', nudge && 'animate-pulse')}
            >
              Ya pagué
            </button>
          </div>
        </div>
      )}

      {/* Pantalla única (sin scroll) para enviar el comprobante */}
      {phase === 'comprobante' && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/80 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true">
          <div className="relative flex max-h-full w-full max-w-md animate-popIn flex-col overflow-hidden rounded-3xl bg-white shadow-dark">
            <div className="bg-[#0a0a0a] px-5 pb-5 pt-6 text-center text-white">
              <Stepper current={2} dark />
              <p className="mt-4 text-4xl">📸</p>
              <h2 className="mt-2 font-heading text-2xl font-black uppercase leading-tight">
                {returned ? '¿Ya pagaste? ¡Último paso!' : 'Envía tu comprobante'}
              </h2>
              <p className="mt-1 text-sm text-white/65">
                Tu pedido <strong className="text-primary-light">{order.orderNumber}</strong> se confirma cuando recibimos la foto de tu pago de{' '}
                <strong className="text-white">{formatPrice(order.payNow)}</strong>.
              </p>
            </div>
            <div className="p-5">
              <ol className="grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: '👆', text: 'Toca el botón verde' },
                  { icon: '💬', text: 'Se abre WhatsApp con tu pedido listo' },
                  { icon: '📎', text: 'Adjunta la captura y envía' },
                ].map((step) => (
                  <li key={step.text} className="rounded-2xl bg-cream-alt/70 px-2 py-3">
                    <span className="text-xl">{step.icon}</span>
                    <span className="mt-1 block text-[11px] font-bold leading-tight text-ink">{step.text}</span>
                  </li>
                ))}
              </ol>
              <a href={sendUrl} target="_blank" rel="noopener noreferrer" onClick={markSent} className="btn-whatsapp btn-shine mt-4 w-full py-5 text-base">
                <WhatsAppIcon size={22} /> Enviar comprobante y confirmar
              </a>
              <button
                type="button"
                onClick={() => {
                  setReturned(false);
                  setPhase('pagar');
                }}
                className="mt-3 w-full text-center text-xs font-bold text-muted underline underline-offset-4 hover:text-ink"
              >
                ← Aún no pago · ver los datos bancarios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Indicador de 2 pasos: pagar → enviar comprobante.
function Stepper({ current = 1, dark = false }: { current?: 1 | 2; dark?: boolean }) {
  const steps = ['Haz tu pago', 'Envía el comprobante'];
  return (
    <ol className="mx-auto flex max-w-xs items-center justify-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex items-center gap-2">
            {i > 0 && <span className={classNames('h-px w-6', dark ? 'bg-white/25' : 'bg-border')} />}
            <span
              className={classNames(
                'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black',
                done ? 'bg-whatsapp text-white' : active ? 'bg-gold-gradient text-ink' : dark ? 'bg-white/10 text-white/50' : 'bg-white text-muted ring-1 ring-border',
              )}
            >
              {done ? '✓' : n}
            </span>
            <span className={classNames('text-[11px] font-extrabold uppercase tracking-wide', active ? (dark ? 'text-white' : 'text-ink') : dark ? 'text-white/45' : 'text-muted')}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
