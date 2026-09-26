'use client';

import ExchangePolicy from '@/components/ExchangePolicy';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getLocalOrder, getOrderById } from '@/lib/orders';
import { bankAccountText, buildOrderWhatsAppMessage, buildReceiptMessage, classNames, formatPrice, paymentMethodLabel, whatsappLinkTo } from '@/lib/utils';
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

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const { whatsappCountryCode, whatsappNumber, payments, shipping, footer } = useSiteSettings();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

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
  const orderMessage = buildOrderWhatsAppMessage(order);
  const receiptMessage = buildReceiptMessage(order);

  return (
    <div className="bg-cream-alt/50">
      <div className="container-page max-w-3xl py-10 sm:py-14">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 animate-popIn items-center justify-center rounded-full bg-gold-gradient text-4xl text-ink shadow-lift">
            ✓
          </div>
          <h1 className="mt-5 font-heading text-3xl font-black uppercase text-ink sm:text-4xl">¡Gracias, {firstName}!</h1>
          <p className="mt-2 text-muted">
            Recibimos tu pedido <strong className="text-ink">{order.orderNumber}</strong>. Ya mismo lo alistamos.
          </p>
        </div>

        {/* Paso 1: WhatsApp */}
        <div className="mt-8 rounded-3xl bg-white p-5 shadow-soft sm:p-7">
          <p className="flex items-center gap-2 text-sm font-black uppercase text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs text-white">1</span>
            Confirma tu pedido por WhatsApp
          </p>
          <p className="mt-2 text-sm text-muted">
            Ya te abrimos WhatsApp con el resumen de tu pedido. Si no se abrió, toca el botón y envíanos el mensaje:
          </p>
          <a
            href={whatsappLinkTo(whatsappNumber, orderMessage, whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp btn-shine mt-4 w-full py-4"
          >
            <WhatsAppIcon size={22} /> Enviar mi pedido por WhatsApp
          </a>
        </div>

        {/* Paso 2: Pago */}
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-soft sm:p-7">
          <p className="flex items-center gap-2 text-sm font-black uppercase text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs text-white">2</span>
            {isCod ? `Paga hoy ${formatPrice(order.payNow)} del envío` : `Paga ${formatPrice(order.payNow)} por transferencia o depósito`}
          </p>
          <p className="mt-2 text-sm text-muted">
            {isCod ? (
              <>
                Con este pago garantizas tu pedido. Tus zapatos (<strong className="text-ink">{formatPrice(order.payOnDelivery)}</strong>) los
                pagas en efectivo cuando te los entregue Servientrega.
              </>
            ) : (
              'Desde la app de cualquier banco o en ventanilla / agente Pichincha Mi Vecino. Toca “Copiar” y pega en tu banco.'
            )}
          </p>

          <div className="mt-4 grid gap-3">
            {payments.bankAccounts.map((account) => (
              <BankCard key={account.bank + account.number} account={account} amount={order.payNow} />
            ))}
          </div>

          {isCod && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-gold-50 p-3 ring-1 ring-primary/30">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Hoy</p>
                <p className="text-2xl font-black text-ink">{formatPrice(order.payNow)}</p>
              </div>
              <div className="rounded-2xl bg-cream-alt p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Al recibir</p>
                <p className="text-2xl font-black text-ink">{formatPrice(order.payOnDelivery)}</p>
              </div>
            </div>
          )}
          <p className="mt-3 text-center text-[11px] text-muted">🔒 Esta es nuestra única cuenta oficial. Nunca te pediremos pagar a otra.</p>
        </div>

        {/* Paso 3: Comprobante */}
        <div className="relative mt-4 overflow-hidden rounded-3xl bg-white p-5 shadow-soft ring-2 ring-whatsapp/40 sm:p-7">
          <p className="flex items-center gap-2 text-sm font-black uppercase text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-whatsapp text-xs text-white">3</span>
            ¿Ya pagaste? Envíanos el comprobante
          </p>
          <ol className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { icon: '👆', text: 'Toca el botón verde' },
              { icon: '💬', text: 'Se abre WhatsApp con tu mensaje listo' },
              { icon: '📎', text: 'Adjunta la foto o captura y envía' },
            ].map((step) => (
              <li key={step.text} className="rounded-2xl bg-cream-alt/70 px-2 py-3">
                <span className="text-xl">{step.icon}</span>
                <span className="mt-1 block text-[11px] font-bold leading-tight text-ink">{step.text}</span>
              </li>
            ))}
          </ol>
          <a
            href={whatsappLinkTo(whatsappNumber, receiptMessage, whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp btn-shine mt-4 w-full py-5 text-base"
          >
            <WhatsAppIcon size={22} /> Ya pagué · Enviar comprobante
          </a>
          <p className="mt-3 text-center text-xs text-muted">
            Apenas lo recibimos despachamos con Servientrega y te mandamos tu número de guía. Llega en {shipping.deliveryTime}.
          </p>
        </div>

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
    </div>
  );
}
