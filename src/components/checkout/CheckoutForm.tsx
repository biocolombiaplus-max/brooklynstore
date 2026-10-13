'use client';

import PaymentLogos, { CourierLogo } from '@/components/brand/PaymentLogos';
import { useEffect, useMemo, useState } from 'react';
import { notifyOrderByEmail, notifyOrderByPush } from '@/lib/localOrders';
import { getCantons, getProvinces } from '@/lib/ecuador';
import { codUnitPrice, computeOrderTotals } from '@/lib/shipping';
import { clearCoupon, couponPercentFor, getActiveCoupon, redeemAnyCouponCode, type WonCoupon } from '@/lib/coupon';
import { useSiteSettings } from '@/lib/settings-context';
import { buildOrderWhatsAppMessage, classNames, formatPrice, generateOrderNumber, whatsappLinkTo } from '@/lib/utils';
import { trackPixel } from '@/lib/pixel';
import { trackVisitorCheckoutItems, trackVisitorContact, trackVisitorPurchase } from '@/lib/visitor';
import type { CartItem, OrderCustomer, PaymentMethod } from '@/lib/types';

const PROVINCES = getProvinces();

type FormState = {
  name: string;
  phone: string;
  cedula: string;
  province: string;
  city: string;
  address: string;
  reference: string;
  note: string;
};

const EMPTY_FORM: FormState = {
  name: '',
  phone: '',
  cedula: '',
  province: '',
  city: '',
  address: '',
  reference: '',
  note: '',
};

const FORM_STORAGE_KEY = 'brooklyn-checkout-form';

function loadSavedForm(): FormState {
  if (typeof window === 'undefined') return EMPTY_FORM;
  try {
    const raw = localStorage.getItem(FORM_STORAGE_KEY);
    return raw ? { ...EMPTY_FORM, ...(JSON.parse(raw) as Partial<FormState>), note: '' } : EMPTY_FORM;
  } catch {
    return EMPTY_FORM;
  }
}

function saveForm(form: FormState) {
  try {
    localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(form));
  } catch {
    // Sin almacenamiento el cliente simplemente vuelve a escribir sus datos.
  }
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 9 && digits.length <= 13;
}

/**
 * Formulario de compra compartido por la "compra rápida" de la ficha de
 * producto y por el checkout del carrito. Al confirmar, el pedido se
 * registra (etiquetado "WhatsApp") y se abre WhatsApp con el resumen
 * completo y la forma de pago elegida: un asesor real confirma y coordina
 * el pago en el chat (genera más confianza que pagar a ciegas en la web).
 */
export default function CheckoutForm({
  items,
  initialMethod = 'transferencia',
  onSuccess,
}: {
  items: CartItem[];
  initialMethod?: PaymentMethod;
  onSuccess: (orderId: string, opened: boolean) => void;
}) {
  const settings = useSiteSettings();
  const bank = settings.payments.bankAccounts[0];
  const codEnabled = settings.payments.codEnabled;
  const [method, setMethod] = useState<PaymentMethod>(codEnabled ? initialMethod : 'transferencia');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [attempted, setAttempted] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [coupon, setCoupon] = useState<WonCoupon | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showCoupon, setShowCoupon] = useState(false);

  // Datos guardados de una compra anterior en este mismo celular: el cliente
  // que vuelve no tiene que escribir todo otra vez.
  useEffect(() => {
    setForm(loadSavedForm());
    setCoupon(getActiveCoupon());
  }, []);

  // Registra los zapatos que está comprando (también en la compra rápida
  // desde la ficha, que no pasa por el carrito).
  useEffect(() => {
    trackVisitorCheckoutItems(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // La base de datos se carga en segundo plano mientras el cliente llena
  // sus datos (no frena la página): al confirmar, el pedido se guarda al instante.
  useEffect(() => {
    const preload = () => import('@/lib/orders').catch(() => {});
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    if (w.requestIdleCallback) w.requestIdleCallback(preload);
    else setTimeout(preload, 1500);
  }, []);

  const cantons = useMemo(() => getCantons(form.province), [form.province]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const totals = computeOrderTotals(settings, items, method, form.province, couponPercentFor(coupon, method));
  const transferTotals = computeOrderTotals(settings, items, 'transferencia', form.province, couponPercentFor(coupon, 'transferencia'));
  const codTotals = computeOrderTotals(settings, items, 'contra_entrega', form.province, couponPercentFor(coupon, 'contra_entrega'));
  // El cupón existe pero no aplica al método elegido (ej. 10% solo transferencia).
  const couponBlocked = !!coupon && couponPercentFor(coupon, method) === 0;

  const errors = {
    name: form.name.trim().length < 3,
    phone: !isValidPhone(form.phone),
    province: !form.province,
    city: !form.city,
    // La dirección es opcional: el asesor la confirma por WhatsApp.
    address: false,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  // Apenas tiene nombre y celular válidos se guardan para el panel de
  // carritos abandonados (así se le puede ayudar si no termina la compra).
  useEffect(() => {
    if (form.name.trim().length < 3 || !isValidPhone(form.phone)) return;
    const t = setTimeout(() => trackVisitorContact(form.name, form.phone), 1200);
    return () => clearTimeout(t);
  }, [form.name, form.phone]);

  useEffect(() => {
    if (!attempted || !hasErrors) return;
    document.querySelector('[data-invalid="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [attempted, hasErrors]);

  function update<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => (key === 'province' ? { ...f, province: value, city: '' } : { ...f, [key]: value }));
  }

  function fieldProps(key: keyof typeof errors) {
    const invalid = attempted && errors[key];
    return {
      'data-invalid': invalid ? 'true' : undefined,
      className: classNames('input-pro', invalid && 'border-urgent bg-urgent/5 ring-2 ring-urgent/20'),
    };
  }

  async function applyCoupon() {
    setCouponError('');
    const { coupon: result, error: couponErr } = await redeemAnyCouponCode(couponInput);
    if (!result) {
      setCouponError(couponErr ?? 'Ese cupón no es válido o ya venció.');
      return;
    }
    setCoupon(result);
    setCouponInput('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setAttempted(true);
    if (hasErrors) {
      setError('Revisa los campos marcados en rojo, porfa.');
      return;
    }

    // WhatsApp se abre AQUÍ, dentro del clic (si se abre después de esperar
    // a la base de datos, el celular lo bloquea). El pedido se registra en
    // paralelo con el mismo número que lleva el mensaje.
    setSubmitting(true);
    const orderNumber = generateOrderNumber();
    let opened = false;

    try {
      const customer: OrderCustomer = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        province: form.province,
        city: form.city,
        address: form.address.trim(),
        ...(form.cedula.trim() ? { cedula: form.cedula.trim() } : {}),
        ...(form.reference.trim() ? { reference: form.reference.trim() } : {}),
        ...(form.note.trim() ? { note: form.note.trim() } : {}),
      };

      // En contra entrega cada producto se registra con su precio contra
      // entrega, para que el detalle cuadre con el total del pedido.
      const orderItems =
        method === 'contra_entrega' ? items.map((i) => ({ ...i, price: codUnitPrice(i, settings) })) : items;
      const orderData = {
        items: orderItems,
        subtotal: totals.subtotal,
        discount: totals.discount,
        shipping: totals.shipping,
        total: totals.total,
        payNow: totals.payNow,
        payOnDelivery: totals.payOnDelivery,
        customer,
        paymentMethod: method,
        status: 'pendiente' as const,
        couponCode: couponBlocked ? undefined : coupon?.code,
        channel: 'whatsapp' as const,
      };

      const message = buildOrderWhatsAppMessage({ ...orderData, orderNumber }, { request: true });
      opened = !!window.open(whatsappLinkTo(settings.whatsappNumber, message, settings.whatsappCountryCode), '_blank');

      const { createOrder } = await import('@/lib/orders');
      const { id } = await createOrder(orderData, { orderNumber });

      trackVisitorPurchase(orderNumber);
      // Píxel: compra registrada (el ID del pedido evita contarla dos veces).
      trackPixel(
        'Purchase',
        {
          content_ids: items.map((i) => i.metaId || i.productId),
          contents: items.map((i) => ({ id: i.metaId || i.productId, quantity: i.quantity, item_price: i.price })),
          content_type: 'product',
          num_items: items.reduce((n, i) => n + i.quantity, 0),
          value: totals.total,
          currency: 'USD',
        },
        orderNumber,
      );

      notifyOrderByEmail({
        to: settings.notificationEmail,
        storeName: settings.storeName,
        accentColor: settings.colors.primary,
        orderNumber,
        items: orderItems,
        subtotal: totals.subtotal,
        shipping: totals.shipping,
        total: totals.total,
        payNow: totals.payNow,
        payOnDelivery: totals.payOnDelivery,
        paymentMethod: method,
        customer,
      });
      notifyOrderByPush({
        orderNumber,
        total: totals.total,
        customerName: customer.name,
        city: customer.city,
        pairs: orderItems.reduce((n, i) => n + i.quantity, 0),
        method,
      });

      saveForm(form);
      if (coupon && !couponBlocked) {
        if (coupon.loyalty)
          import('@/lib/loyalty')
            .then(({ markLoyaltyCouponUsed }) => markLoyaltyCouponUsed(coupon.code, orderNumber))
            .catch(() => {});
        clearCoupon();
      }
      onSuccess(id, opened);
    } catch (err) {
      console.error(err);
      setError(
        opened
          ? 'Tu pedido ya está en WhatsApp: envía el mensaje y te atendemos de una.'
          : 'Uy, no pudimos registrar tu pedido. Intenta otra vez o escríbenos directo por WhatsApp.',
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      {/* 1. Datos: lo primero que se ve, campos grandes con su nombre arriba. */}
      <fieldset className="space-y-3.5 rounded-3xl border-2 border-buy/60 bg-white p-4 shadow-[0_10px_30px_rgba(255,106,0,0.12)] sm:p-5">
        <legend className="sr-only">Tus datos para el envío</legend>
        <div className="flex items-start gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-buy text-xs font-black text-white">1</span>
          <div>
            <p className="text-base font-black leading-tight text-ink">Escribe tus datos para el envío ✍️</p>
            <p className="mt-0.5 text-xs text-muted">Solo 4 datos · menos de 30 segundos</p>
          </div>
        </div>

        <Field label="Tu nombre y apellido" error={attempted && errors.name ? 'Escribe tu nombre y apellido.' : ''}>
          <input
            placeholder="Ej: María Pérez"
            autoComplete="name"
            enterKeyHint="next"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            {...fieldProps('name')}
          />
        </Field>

        <Field
          label="Tu celular / WhatsApp"
          hint="Por aquí te confirmamos tu pedido."
          error={attempted && errors.phone ? 'Escribe un celular válido, ej: 0991234567.' : ''}
        >
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="next"
            placeholder="Ej: 0991234567"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            {...fieldProps('phone')}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Provincia" error={attempted && errors.province ? 'Elige tu provincia.' : ''}>
            <select value={form.province} onChange={(e) => update('province', e.target.value)} {...fieldProps('province')}>
              <option value="">Elegir…</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Ciudad" error={attempted && errors.city ? 'Elige tu ciudad.' : ''}>
            <select value={form.city} disabled={!form.province} onChange={(e) => update('city', e.target.value)} {...fieldProps('city')}>
              <option value="">Elegir…</option>
              {cantons.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Dirección" optional>
          <input
            placeholder="Calle principal, número y secundaria"
            autoComplete="street-address"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            {...fieldProps('address')}
          />
        </Field>

        {/* Menos campos a la vista = compra más rápida: lo demás es opcional. */}
        {showNote || form.note || form.reference || form.cedula ? (
          <>
            <Field label="Referencia" optional>
              <input
                placeholder="Ej: frente al parque, casa esquinera azul"
                value={form.reference}
                onChange={(e) => update('reference', e.target.value)}
                className="input-pro"
              />
            </Field>
            <Field label="Cédula (para la guía)" optional>
              <input
                inputMode="numeric"
                placeholder="Ej: 0912345678"
                value={form.cedula}
                onChange={(e) => update('cedula', e.target.value.replace(/[^0-9]/g, '').slice(0, 13))}
                className="input-pro"
              />
            </Field>
            <Field label="Nota" optional>
              <input placeholder="Algo que debamos saber" value={form.note} onChange={(e) => update('note', e.target.value)} className="input-pro" />
            </Field>
          </>
        ) : (
          <button type="button" onClick={() => setShowNote(true)} className="text-left text-xs font-bold text-muted underline underline-offset-4 hover:text-ink">
            + Agregar referencia, cédula o nota (opcional)
          </button>
        )}
      </fieldset>

      {/* 2. Forma de pago: compacta (ya la eligió en la ficha). */}
      <fieldset>
        <legend className="mb-3 flex items-center gap-2.5 text-base font-black text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs text-white">2</span>
          ¿Cómo quieres pagar?
        </legend>
        <div className={classNames('grid gap-2.5', codEnabled && 'grid-cols-2')}>
          {codEnabled && (
            <MethodChip
              selected={method === 'contra_entrega'}
              onSelect={() => setMethod('contra_entrega')}
              title="💵 Contra entrega"
              sub={`${formatPrice(codTotals.payOnDelivery)} al recibir + ${formatPrice(codTotals.payNow)} envío`}
            />
          )}
          <MethodChip
            selected={method === 'transferencia'}
            onSelect={() => setMethod('transferencia')}
            title="⚡ Pagar ya"
            sub={`${formatPrice(transferTotals.total)} por transferencia${coupon?.onlyMethod === 'transferencia' ? ` · -${coupon.percent}%` : ''}`}
          />
        </div>
        <p className="mt-2.5 rounded-xl bg-cream-alt/70 px-3 py-2.5 text-[12px] leading-snug text-ink">
          💬 Un <strong>asesor real</strong> te confirma talla y disponibilidad por WhatsApp
          {method === 'contra_entrega'
            ? ` · tus zapatos los pagas en efectivo al recibirlos (${settings.shipping.deliveryTime}).`
            : ' y te pasa la cuenta oficial Banco Pichincha.'}
        </p>
      </fieldset>

      {/* 3. Resumen y confirmación */}
      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs text-white">3</span>
          Confirma tu pedido
        </legend>

        <div className="rounded-2xl border border-border bg-cream-alt/60 p-4 text-sm sm:p-5">
          <Row label={method === 'contra_entrega' ? 'Productos (pagas al recibir)' : 'Productos'} value={formatPrice(totals.subtotal)} />
          {coupon && couponBlocked ? (
            <div className="my-1 rounded-xl bg-gold-50 p-3 text-xs ring-1 ring-primary/40">
              <p className="font-bold text-ink">
                🎁 Tu cupón {coupon.code} ({coupon.percent}% OFF) aplica pagando por transferencia o depósito.
              </p>
              <button type="button" onClick={() => setMethod('transferencia')} className="mt-2 font-extrabold text-primary-hover underline">
                Cambiar a transferencia y ahorrar {formatPrice(transferTotals.discount)} →
              </button>
            </div>
          ) : coupon ? (
            <div className="flex items-center justify-between py-1 font-bold text-primary">
              <span>🎟️ Cupón {coupon.code} (-{coupon.percent}%)</span>
              <span className="flex items-center gap-2">
                -{formatPrice(totals.discount)}
                <button
                  type="button"
                  onClick={() => {
                    clearCoupon();
                    setCoupon(null);
                  }}
                  className="text-xs font-normal text-muted underline"
                >
                  Quitar
                </button>
              </span>
            </div>
          ) : showCoupon ? (
            <div className="py-2">
              <div className="flex gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      applyCoupon();
                    }
                  }}
                  placeholder="Código del cupón"
                  className="input py-2.5 text-sm uppercase"
                />
                <button type="button" onClick={applyCoupon} disabled={!couponInput.trim()} className="btn-dark shrink-0 px-4 py-2.5 text-xs">
                  Aplicar
                </button>
              </div>
              {couponError && <p className="mt-1 text-xs text-urgent">{couponError}</p>}
            </div>
          ) : (
            <button type="button" onClick={() => setShowCoupon(true)} className="py-1 text-xs font-bold text-primary underline">
              ¿Tienes un cupón de descuento?
            </button>
          )}
          <Row
            label={method === 'contra_entrega' ? 'Envío Servientrega (para despachar)' : 'Envío Servientrega'}
            value={totals.shipping === 0 ? 'Sin costo' : formatPrice(totals.shipping)}
          />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-base font-black text-ink">
            <span>Total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-ink p-3 text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-light">Para despachar</p>
              <p className="mt-0.5 text-xl font-black">{formatPrice(totals.payNow)}</p>
              <p className="text-[10px] text-white/70">{method === 'contra_entrega' ? 'el envío, al confirmar por WhatsApp' : 'al confirmar por WhatsApp'}</p>
            </div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-border">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Pagas al recibir</p>
              <p className="mt-0.5 text-xl font-black text-ink">{formatPrice(totals.payOnDelivery)}</p>
              <p className="text-[10px] text-muted">{method === 'contra_entrega' ? 'en efectivo' : 'nada más 🙌'}</p>
            </div>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-urgent/10 p-3 text-sm font-semibold text-urgent">{error}</p>}

        <p className="mt-2 text-center text-xs text-muted">
          Se abre WhatsApp con tu pedido listo: solo toca <strong className="text-ink">Enviar</strong>. Un asesor te responde y coordina el
          pago contigo. <strong className="text-ink">No pagas nada en esta página.</strong>
        </p>
        <div className="mt-4 flex flex-col items-center gap-2 border-t border-border pt-4">
          <PaymentLogos size="sm" className="justify-center" />
          <p className="flex items-center gap-2 text-[11px] font-bold text-muted">
            Tu pedido viaja con <CourierLogo size="sm" />
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted">
          <span>🔒 Datos protegidos</span>
          <span>🛡️ Garantía Brooklyn</span>
          <span>🔄 Cambio de talla en 48 h</span>
        </div>
      </fieldset>

      {/* Botón siempre a la vista (fijo abajo mientras se llenan los datos). */}
      <div className="sticky bottom-0 z-10 -mx-5 mt-5 bg-gradient-to-t from-white via-white to-white/0 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-4">
        <button type="submit" disabled={submitting} className="btn-whatsapp btn-shine w-full py-5 text-base">
          {submitting ? 'Abriendo WhatsApp...' : '👉 Clic aquí para confirmar mi pedido por WhatsApp'}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  optional = false,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
        {label}
        {optional ? <span className="font-semibold text-muted">(opcional)</span> : <span className="text-buy">*</span>}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs font-semibold text-urgent">{error}</span> : hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

function MethodChip({ selected, onSelect, title, sub }: { selected: boolean; onSelect: () => void; title: string; sub: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={classNames(
        'relative rounded-2xl border-2 px-3 py-3 text-left transition-all',
        selected ? 'border-ink bg-ink text-white shadow-dark' : 'border-border bg-white text-ink',
      )}
    >
      {selected && <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-whatsapp text-[10px] text-white">✓</span>}
      <span className="block pr-5 text-sm font-black">{title}</span>
      <span className={classNames('mt-0.5 block text-[11px] leading-snug', selected ? 'text-white/70' : 'text-muted')}>{sub}</span>
    </button>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-muted">
      <span>{label}</span>
      <span className={highlight ? 'font-extrabold text-whatsapp' : 'font-semibold text-ink'}>{value}</span>
    </div>
  );
}
