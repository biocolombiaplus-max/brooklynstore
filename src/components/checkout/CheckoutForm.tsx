'use client';

import PaymentLogos, { CourierLogo } from '@/components/brand/PaymentLogos';
import { useEffect, useMemo, useState } from 'react';
import { createOrder, notifyOrderByEmail, notifyOrderByPush } from '@/lib/orders';
import { getCantons, getProvinces } from '@/lib/ecuador';
import { codUnitPrice, computeOrderTotals } from '@/lib/shipping';
import { clearCoupon, getActiveCoupon, redeemCouponCode, type WonCoupon } from '@/lib/coupon';
import { useSiteSettings } from '@/lib/settings-context';
import { buildOrderWhatsAppMessage, classNames, formatPrice, whatsappLinkTo } from '@/lib/utils';
import type { CartItem, OrderCustomer, PaymentMethod } from '@/lib/types';
import LocationCapture from '@/components/product/LocationCapture';
import { CheckIcon, WhatsAppIcon } from '@/components/icons';

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
 * producto y por el checkout del carrito. Todo pedido termina en WhatsApp
 * con el resumen completo (productos, totales, cuánto paga ahora y cuánto al
 * recibir, y datos de entrega).
 */
export default function CheckoutForm({
  items,
  initialMethod = 'transferencia',
  onSuccess,
}: {
  items: CartItem[];
  initialMethod?: PaymentMethod;
  onSuccess: (orderId: string) => void;
}) {
  const settings = useSiteSettings();
  const codEnabled = settings.payments.codEnabled;
  const [method, setMethod] = useState<PaymentMethod>(codEnabled ? initialMethod : 'transferencia');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [locationUrl, setLocationUrl] = useState('');
  const [attempted, setAttempted] = useState(false);
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

  const cantons = useMemo(() => getCantons(form.province), [form.province]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);
  const totals = computeOrderTotals(settings, items, method, form.province, coupon?.percent ?? 0);
  const transferTotals = computeOrderTotals(settings, items, 'transferencia', form.province, coupon?.percent ?? 0);
  const codTotals = computeOrderTotals(settings, items, 'contra_entrega', form.province, coupon?.percent ?? 0);

  const errors = {
    name: form.name.trim().length < 3,
    phone: !isValidPhone(form.phone),
    province: !form.province,
    city: !form.city,
    address: form.address.trim().length < 5,
  };
  const hasErrors = Object.values(errors).some(Boolean);

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
      className: classNames('input', invalid && 'border-urgent ring-2 ring-urgent/20'),
    };
  }

  function applyCoupon() {
    setCouponError('');
    const result = redeemCouponCode(couponInput);
    if (!result) {
      setCouponError('Ese cupón no es válido o ya venció.');
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

    // La pestaña de WhatsApp se abre DENTRO del clic (antes de cualquier
    // espera) para que el navegador no la bloquee como ventana emergente.
    const waWindow = window.open('', '_blank');
    setSubmitting(true);

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
        ...(locationUrl ? { locationUrl } : {}),
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
        couponCode: coupon?.code,
      };

      const { id, orderNumber } = await createOrder(orderData);

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
      notifyOrderByPush({ orderNumber, total: totals.total, customerName: customer.name });

      const waUrl = whatsappLinkTo(
        settings.whatsappNumber,
        buildOrderWhatsAppMessage({ ...orderData, orderNumber }),
        settings.whatsappCountryCode,
      );
      if (waWindow) waWindow.location.href = waUrl;
      else window.open(waUrl, '_blank');

      saveForm(form);
      if (coupon) clearCoupon();
      onSuccess(id);
    } catch (err) {
      console.error(err);
      waWindow?.close();
      setError('Uy, no pudimos registrar tu pedido. Intenta otra vez o escríbenos directo por WhatsApp.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-7">
      {/* 1. Forma de pago */}
      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] text-white">1</span>
          ¿Cómo quieres pagar?
        </legend>
        <div className="grid gap-3">
          <PaymentOption
            selected={method === 'transferencia'}
            onSelect={() => setMethod('transferencia')}
            icon="🏦"
            title="Transferencia o depósito Pichincha"
            lines={[
              `${formatPrice(transferTotals.subtotal)} por transferencia o depósito en Banco Pichincha`,
              'Te damos los datos bancarios al confirmar · Despacho el mismo día',
            ]}
          />
          {codEnabled && (
            <PaymentOption
              selected={method === 'contra_entrega'}
              onSelect={() => setMethod('contra_entrega')}
              icon="💵"
              title="Pago contra entrega"
              badge={`Hoy solo ${formatPrice(codTotals.payNow)}`}
              lines={[
                `Hoy ${formatPrice(codTotals.payNow)} de envío · ${formatPrice(codTotals.payOnDelivery)} en efectivo al recibir`,
                'El envío garantiza tu pedido; lo demás lo pagas con tus zapatos en la mano',
              ]}
            />
          )}
          {codEnabled && method === 'contra_entrega' && (
            <div className="mt-3 animate-slideUp overflow-hidden rounded-2xl bg-ink text-white ring-1 ring-primary/40">
              <p className="px-4 pt-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary-light">
                Así funciona el pago contra entrega
              </p>
              <ol className="space-y-3 px-4 pb-4 pt-3">
                {[
                  {
                    amount: formatPrice(codTotals.payNow),
                    title: 'Hoy: pagas el envío y garantizas tu pedido',
                    text: 'Transferencia o depósito en Banco Pichincha. Te pasamos la cuenta por WhatsApp.',
                  },
                  { amount: '🚚', title: 'Despachamos tu pedido', text: `Llega a la dirección que nos indiques en ${settings.shipping.deliveryTime}.` },
                  {
                    amount: formatPrice(codTotals.payOnDelivery),
                    title: 'Al recibir: pagas tus zapatos',
                    text: 'En efectivo, cuando tienes tus zapatos en la mano.',
                  },
                ].map((step, i) => (
                  <li key={step.title} className="flex items-center gap-3">
                    <span className="flex h-12 min-w-[64px] shrink-0 items-center justify-center rounded-xl bg-gold-gradient px-2 text-sm font-black text-ink">
                      {step.amount}
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold">
                        {i + 1}. {step.title}
                      </span>
                      <span className="block text-xs text-white/60">{step.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="border-t border-white/10 px-4 py-3 text-center text-xs font-bold">
                Total {formatPrice(codTotals.total)} = <span className="text-primary-light">{formatPrice(codTotals.payNow)} hoy</span> +{' '}
                <span className="text-primary-light">{formatPrice(codTotals.payOnDelivery)} al recibir</span>
              </p>
            </div>
          )}
        </div>
      </fieldset>

      {/* 2. Datos de entrega */}
      <fieldset className="space-y-3">
        <legend className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] text-white">2</span>
          ¿A dónde te lo enviamos?
        </legend>

        <div>
          <input
            placeholder="Nombre y apellido *"
            autoComplete="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            {...fieldProps('name')}
          />
          {attempted && errors.name && <p className="mt-1 text-xs text-urgent">Escribe tu nombre y apellido.</p>}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Celular / WhatsApp * (09...)"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              {...fieldProps('phone')}
            />
            {attempted && errors.phone && <p className="mt-1 text-xs text-urgent">Escribe un celular válido, ej: 0991234567.</p>}
          </div>
          <input
            inputMode="numeric"
            placeholder="Cédula (para la guía de envío)"
            value={form.cedula}
            onChange={(e) => update('cedula', e.target.value.replace(/[^0-9]/g, '').slice(0, 13))}
            className="input"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <select value={form.province} onChange={(e) => update('province', e.target.value)} {...fieldProps('province')}>
              <option value="">Provincia *</option>
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {attempted && errors.province && <p className="mt-1 text-xs text-urgent">Elige tu provincia.</p>}
          </div>
          <div>
            <select
              value={form.city}
              disabled={!form.province}
              onChange={(e) => update('city', e.target.value)}
              {...fieldProps('city')}
            >
              <option value="">{form.province ? 'Ciudad / cantón *' : 'Elige la provincia primero'}</option>
              {cantons.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {attempted && errors.city && <p className="mt-1 text-xs text-urgent">Elige tu ciudad.</p>}
          </div>
        </div>

        <div>
          <input
            placeholder="Dirección * (calle principal, número y secundaria)"
            autoComplete="street-address"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            {...fieldProps('address')}
          />
          {attempted && errors.address && <p className="mt-1 text-xs text-urgent">Escribe tu dirección completa.</p>}
        </div>

        <input
          placeholder="Referencia (ej: frente al parque, casa esquinera azul)"
          value={form.reference}
          onChange={(e) => update('reference', e.target.value)}
          className="input"
        />
        <input
          placeholder="Nota para tu pedido (opcional)"
          value={form.note}
          onChange={(e) => update('note', e.target.value)}
          className="input"
        />

        <LocationCapture value={locationUrl} onCapture={setLocationUrl} />
      </fieldset>

      {/* 3. Resumen y confirmación */}
      <fieldset>
        <legend className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] text-white">3</span>
          Confirma tu pedido
        </legend>

        <div className="rounded-2xl border border-border bg-cream-alt/60 p-4 text-sm sm:p-5">
          <Row label={method === 'contra_entrega' ? 'Productos (pagas al recibir)' : 'Productos'} value={formatPrice(totals.subtotal)} />
          {coupon ? (
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
            label={method === 'contra_entrega' ? 'Envío Servientrega (se paga hoy)' : 'Envío Servientrega'}
            value={totals.shipping === 0 ? 'Sin costo' : formatPrice(totals.shipping)}
          />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-base font-black text-ink">
            <span>Total</span>
            <span>{formatPrice(totals.total)}</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-xl bg-ink p-3 text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-light">Pagas ahora</p>
              <p className="mt-0.5 text-xl font-black">{formatPrice(totals.payNow)}</p>
              <p className="text-[10px] text-white/70">{method === 'contra_entrega' ? 'garantiza tu envío' : 'transferencia / depósito Pichincha'}</p>
            </div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-border">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Pagas al recibir</p>
              <p className="mt-0.5 text-xl font-black text-ink">{formatPrice(totals.payOnDelivery)}</p>
              <p className="text-[10px] text-muted">{method === 'contra_entrega' ? 'en efectivo' : 'nada más 🙌'}</p>
            </div>
          </div>
        </div>

        {error && <p className="mt-4 rounded-xl bg-urgent/10 p-3 text-sm font-semibold text-urgent">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-whatsapp btn-shine mt-5 w-full py-5 text-base">
          <WhatsAppIcon size={22} />
          {submitting ? 'Enviando tu pedido...' : 'Confirmar pedido por WhatsApp'}
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          {method === 'contra_entrega'
            ? `Se abre WhatsApp con tu pedido listo. Te pasamos la cuenta para adelantar los ${formatPrice(totals.payNow)} del envío.`
            : 'Se abre WhatsApp con tu pedido listo. Te pasamos la cuenta de Banco Pichincha para tu transferencia o depósito.'}
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
    </form>
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

function PaymentOption({
  selected,
  onSelect,
  icon,
  title,
  badge,
  lines,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: string;
  title: string;
  badge?: string;
  lines: string[];
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={classNames(
        'relative flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200',
        selected ? 'border-ink bg-white shadow-dark' : 'border-border bg-white hover:border-ink/40',
      )}
    >
      <span
        className={classNames(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          selected ? 'border-ink bg-ink text-primary-light' : 'border-border',
        )}
      >
        {selected && <CheckIcon size={12} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-black text-ink sm:text-base">
            {icon} {title}
          </span>
          {badge && (
            <span className="rounded-full bg-gold-gradient px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-ink">
              {badge}
            </span>
          )}
        </span>
        {lines.map((line) => (
          <span key={line} className="mt-1 block text-xs leading-relaxed text-muted">
            {line}
          </span>
        ))}
      </span>
    </button>
  );
}
