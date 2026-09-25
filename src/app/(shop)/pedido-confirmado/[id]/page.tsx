'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getLocalOrder, getOrderById } from '@/lib/orders';
import { buildOrderWhatsAppMessage, formatPrice, paymentMethodLabel, whatsappLinkTo } from '@/lib/utils';
import { useSiteSettings } from '@/lib/settings-context';
import PostPurchaseUpsell from '@/components/product/PostPurchaseUpsell';
import { WhatsAppIcon } from '@/components/icons';
import type { BankAccount, Order } from '@/lib/types';

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        });
      }}
      className="shrink-0 rounded-full bg-ink px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white transition-colors hover:bg-primary hover:text-ink"
    >
      {copied ? '✓ Copiado' : 'Copiar'}
    </button>
  );
}

function BankCard({ account }: { account: BankAccount }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 text-left">
      <p className="text-sm font-black uppercase text-ink">{account.bank}</p>
      <p className="text-xs text-muted">{account.type}</p>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-cream-alt px-3 py-2.5">
        <span className="font-mono text-lg font-black tracking-wider text-ink">{account.number}</span>
        <CopyButton value={account.number} />
      </div>
      <p className="mt-2 text-xs text-muted">
        Titular: <strong className="text-ink">{account.holder}</strong>
        {account.idNumber && (
          <>
            {' '}
            · C.I./RUC: <strong className="text-ink">{account.idNumber}</strong>
          </>
        )}
      </p>
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
  const receiptMessage = `¡Hola Brooklyn Store! 👋 Les envío el comprobante de ${formatPrice(order.payNow)} del pedido *${order.orderNumber}* a nombre de ${order.customer.name}. 🧾`;

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
            {isCod ? 'Adelanta el valor del envío' : 'Transfiere o deposita en Banco Pichincha'}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-ink p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-light">
                {isCod ? 'Adelantas hoy' : 'Total a transferir'}
              </p>
              <p className="mt-1 text-3xl font-black">{formatPrice(order.payNow)}</p>
            </div>
            <div className="rounded-2xl bg-cream-alt p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Pagas al recibir</p>
              <p className="mt-1 text-3xl font-black text-ink">{formatPrice(order.payOnDelivery)}</p>
            </div>
          </div>

          <p className="mt-5 text-sm text-muted">
            {isCod
              ? `Transfiere o deposita ${formatPrice(order.payNow)} (valor del envío) en cualquiera de estas cuentas. El resto, ${formatPrice(
                  order.payOnDelivery,
                )}, lo pagas en efectivo cuando recibas tus zapatos.`
              : `Transfiere o deposita ${formatPrice(order.payNow)} en cualquiera de estas cuentas:`}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {payments.bankAccounts.map((account) => (
              <BankCard key={account.bank + account.number} account={account} />
            ))}
          </div>
          {payments.transferNote && <p className="mt-4 rounded-xl bg-gold-50 p-3 text-xs font-semibold text-ink">💡 {payments.transferNote}</p>}
        </div>

        {/* Paso 3: Comprobante */}
        <div className="mt-4 rounded-3xl bg-white p-5 shadow-soft sm:p-7">
          <p className="flex items-center gap-2 text-sm font-black uppercase text-ink">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs text-white">3</span>
            Envíanos la foto del comprobante
          </p>
          <p className="mt-2 text-sm text-muted">
            Apenas lo recibamos despachamos tu pedido y te mandamos el número de guía. Tiempo de entrega: {shipping.deliveryTime}.
          </p>
          <a
            href={whatsappLinkTo(whatsappNumber, receiptMessage, whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark mt-4 w-full py-4"
          >
            🧾 Enviar comprobante por WhatsApp
          </a>
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
              <span>{order.shipping === 0 ? 'GRATIS' : formatPrice(order.shipping)}</span>
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
