'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllOrders, updateOrderStatus, updateOrderShipping, updateOrderGuide, deleteOrder } from '@/lib/orders';
import { getSiteSettings } from '@/lib/settings';
import { CARRIERS, type Order, type OrderStatus, type Carrier, type BankAccount } from '@/lib/types';
import { buildPaymentDataMessage, buildShippedMessage, formatPrice, guidePageUrl, orderPhotoUrl, whatsappLinkTo } from '@/lib/utils';
import { uploadProductImage } from '@/lib/storage';
import { uploadRawFileToFirestore } from '@/lib/firestoreImages';

const STATUSES: { value: OrderStatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const PAYMENT_LABELS: Record<Order['paymentMethod'], string> = {
  contra_entrega: '💵 Contra entrega',
  transferencia: '🏦 Transferencia / depósito',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pendiente: 'bg-urgent/10 text-urgent',
  confirmado: 'bg-primary-light/20 text-primary-hover',
  enviado: 'bg-blue-100 text-blue-700',
  entregado: 'bg-green-100 text-green-700',
  cancelado: 'bg-border text-muted',
};

function buildStatusMessage(order: Order, storeName: string): string {
  const firstName = order.customer.name.split(' ')[0];
  switch (order.status) {
    case 'confirmado':
      return `Hola ${firstName}! Tu pedido ${order.orderNumber} en ${storeName} fue confirmado y ya lo estamos alistando. Te avisamos apenas salga hacia ${order.customer.city}. ¡Gracias por tu compra!`;
    case 'enviado':
      return buildShippedMessage(order, storeName);
    case 'entregado':
      return `Hola ${firstName}! Vimos que tu pedido ${order.orderNumber} ya fue entregado. Esperamos que disfrutes tus zapatos nuevos 🔥 Si necesitas cambio de talla, recuerda escribirnos dentro de las 48 horas de recibido. Si tienes alguna duda, aquí estamos.`;
    case 'cancelado':
      return `Hola ${firstName}, tu pedido ${order.orderNumber} en ${storeName} fue cancelado. Si fue un error o quieres hacer un nuevo pedido, escríbenos y con gusto te ayudamos.`;
    default:
      return `Hola ${firstName}, te escribimos de ${storeName} por tu pedido ${order.orderNumber}. ¿Confirmamos los datos de tu envío?`;
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [storeName, setStoreName] = useState('la tienda');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [savingShipping, setSavingShipping] = useState<string | null>(null);

  useEffect(() => {
    getAllOrders()
      .then(setOrders)
      .catch(() => setOrders([]));
    getSiteSettings()
      .then((s) => {
        setStoreName(s.storeName);
        setBankAccounts(s.payments.bankAccounts);
      })
      .catch(() => {});
  }, []);

  async function handleStatusChange(id: string, status: OrderStatus) {
    await updateOrderStatus(id, status);
    setOrders((prev) => (prev ? prev.map((o) => (o.id === id ? { ...o, status } : o)) : prev));
  }

  async function handleShippingSave(order: Order, carrier: Carrier | '', trackingNumber: string) {
    setSavingShipping(order.id);
    try {
      await updateOrderShipping(order.id, { carrier: carrier || undefined, trackingNumber });
      setOrders((prev) =>
        prev
          ? prev.map((o) => (o.id === order.id ? { ...o, carrier: carrier || undefined, trackingNumber } : o))
          : prev,
      );
    } finally {
      setSavingShipping(null);
    }
  }

  async function handleGuideChange(order: Order, guide: { url: string; type: 'image' | 'pdf' } | null) {
    await updateOrderGuide(order.id, guide);
    setOrders((prev) =>
      prev ? prev.map((o) => (o.id === order.id ? { ...o, guideUrl: guide?.url, guideType: guide?.type } : o)) : prev,
    );
  }

  async function handleDeleteOrder(order: Order) {
    if (!confirm(`¿Eliminar el pedido ${order.orderNumber}? Esta acción no se puede deshacer.`)) return;
    await deleteOrder(order.id);
    setOrders((prev) => (prev ? prev.filter((o) => o.id !== order.id) : prev));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Pedidos</h1>
          <p className="text-sm text-muted">Gestiona el estado, el envío y el seguimiento de cada pedido</p>
        </div>
        <Link href="/admin/pedidos/nuevo" className="btn-primary shrink-0 text-sm">
          + Nuevo pedido
        </Link>
      </div>

      <div className="space-y-4">
        {orders === null ? (
          <p className="text-muted">Cargando pedidos...</p>
        ) : orders.length === 0 ? (
          <p className="rounded-card bg-white p-6 text-center text-muted shadow-soft">Todavía no hay pedidos.</p>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              storeName={storeName}
              bankAccounts={bankAccounts}
              saving={savingShipping === order.id}
              onStatusChange={(status) => handleStatusChange(order.id, status)}
              onShippingSave={(carrier, trackingNumber) => handleShippingSave(order, carrier, trackingNumber)}
              onGuideChange={(guide) => handleGuideChange(order, guide)}
              onDelete={() => handleDeleteOrder(order)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  storeName,
  bankAccounts,
  saving,
  onStatusChange,
  onShippingSave,
  onGuideChange,
  onDelete,
}: {
  order: Order;
  storeName: string;
  bankAccounts: BankAccount[];
  saving: boolean;
  onStatusChange: (status: OrderStatus) => void;
  onShippingSave: (carrier: Carrier | '', trackingNumber: string) => void;
  onGuideChange: (guide: { url: string; type: 'image' | 'pdf' } | null) => Promise<void>;
  onDelete: () => void;
}) {
  const [guideUploading, setGuideUploading] = useState(false);
  const [guideError, setGuideError] = useState('');

  async function handleGuideFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setGuideError('');
    setGuideUploading(true);
    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const url = isPdf ? await uploadRawFileToFirestore(file, 'application/pdf') : await uploadProductImage(file, 'guias', 'original');
      await onGuideChange({ url, type: isPdf ? 'pdf' : 'image' });
    } catch (err) {
      setGuideError(err instanceof Error ? err.message : 'No se pudo subir la guía. Intenta de nuevo.');
    } finally {
      setGuideUploading(false);
    }
  }

  const [carrier, setCarrier] = useState<Carrier | ''>(order.carrier ?? '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber ?? '');
  const shippingChanged = carrier !== (order.carrier ?? '') || trackingNumber !== (order.trackingNumber ?? '');

  return (
    <div className="rounded-card bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-bold text-ink">{order.orderNumber}</p>
          <p className="text-xs text-muted">{new Date(order.createdAt).toLocaleString('es-CO')}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <select
            value={order.status}
            onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
            className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold ${STATUS_COLORS[order.status]}`}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs font-semibold text-muted hover:text-urgent"
          >
            🗑️ Eliminar pedido
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-xs font-bold uppercase text-muted">Cliente</p>
          <p className="text-sm text-ink">{order.customer.name}</p>
          <p className="text-sm text-muted">
            {order.customer.phone}
            {order.customer.cedula && ` · C.I. ${order.customer.cedula}`}
          </p>
          <p className="text-sm text-muted">
            {order.customer.address}, {order.customer.city}, {order.customer.province}
          </p>
          {order.customer.reference && <p className="text-xs text-muted">Referencia: {order.customer.reference}</p>}
          {order.customer.locationUrl && (
            <a
              href={order.customer.locationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm font-semibold text-primary hover:underline"
            >
              📍 Ver ubicación confirmada
            </a>
          )}
          {order.customer.note && (
            <p className="mt-1 text-xs italic text-muted">&ldquo;{order.customer.note}&rdquo;</p>
          )}
        </div>
        <div>
          <p className="mb-1 text-xs font-bold uppercase text-muted">Productos</p>
          <ul className="space-y-2">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-cream-alt/60 p-2 pr-3">
                <a
                  href={item.image || orderPhotoUrl(item) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Ver foto grande"
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-border transition-transform hover:scale-105"
                >
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs text-muted">Sin foto</span>
                  )}
                  {item.quantity > 1 && (
                    <span className="absolute right-1 top-1 rounded-full bg-ink px-1.5 py-0.5 text-[10px] font-black text-white">×{item.quantity}</span>
                  )}
                </a>
                <div className="min-w-0 text-sm">
                  <p className="font-bold leading-tight text-ink">{item.title}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5 text-[11px] font-bold">
                    <span className="rounded-full bg-ink px-2 py-0.5 text-white">
                      Talla {item.size}
                      {item.sizeUs ? ` · US ${item.sizeUs}` : ''}
                    </span>
                    {item.color && <span className="rounded-full bg-white px-2 py-0.5 text-ink ring-1 ring-border">🎨 {item.color}</span>}
                    <span className="rounded-full bg-white px-2 py-0.5 text-ink ring-1 ring-border">× {item.quantity}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-xs font-bold uppercase text-muted">Envío</p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted">Transportadora</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value as Carrier | '')}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Sin asignar</option>
              {CARRIERS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Número de guía</label>
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Ej: 123456789"
              className="rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          {shippingChanged && (
            <button
              onClick={() => onShippingSave(carrier, trackingNumber)}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar guía'}
            </button>
          )}
        </div>

        {/* Foto o PDF de la guía */}
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-cream-alt/60 p-3">
          {order.guideUrl ? (
            <>
              <a
                href={order.guideUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border"
                title="Ver guía"
              >
                {order.guideType === 'pdf' ? (
                  <span className="text-center text-[10px] font-black text-urgent">
                    <span className="block text-2xl">📄</span>PDF
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={order.guideUrl} alt="Guía" className="h-full w-full object-cover" />
                )}
              </a>
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-bold text-ink">✓ Guía adjunta ({order.guideType === 'pdf' ? 'PDF' : 'foto'})</p>
                <div className="mt-1 flex flex-wrap gap-3">
                  <label className="cursor-pointer font-bold text-primary-hover underline">
                    Cambiar
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleGuideFile} disabled={guideUploading} />
                  </label>
                  <button
                    type="button"
                    onClick={() => confirm('¿Quitar la guía adjunta?') && onGuideChange(null)}
                    className="font-bold text-urgent underline"
                  >
                    Quitar
                  </button>
                  {guidePageUrl(order) && (
                    <a href={guidePageUrl(order)!} target="_blank" rel="noopener noreferrer" className="font-bold text-ink underline">
                      Ver como la ve el cliente
                    </a>
                  )}
                </div>
              </div>
            </>
          ) : (
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-primary/50 bg-white px-4 py-3 text-sm font-bold text-ink hover:bg-gold-50">
              {guideUploading ? 'Subiendo guía...' : '📎 Subir guía (foto o PDF)'}
              <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleGuideFile} disabled={guideUploading} />
            </label>
          )}
          {(order.guideUrl || order.trackingNumber) && (
            <a
              href={whatsappLinkTo(order.customer.phone, buildShippedMessage(order, storeName))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.02] sm:w-auto"
            >
              🚚 Enviar guía por WhatsApp
            </a>
          )}
          {guideError && <p className="w-full text-xs font-semibold text-urgent">{guideError}</p>}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="text-sm">
          <span className="text-muted">Subtotal: </span>
          <span className="font-semibold text-ink">{formatPrice(order.subtotal)}</span>
          <span className="ml-3 text-muted">Envío: </span>
          <span className="font-semibold text-ink">
            {order.shipping > 0 ? formatPrice(order.shipping) : 'GRATIS'}
          </span>
          <span className="ml-3 text-muted">Total: </span>
          <span className="font-bold text-primary">{formatPrice(order.total)}</span>
          <span className="ml-3 text-muted">{PAYMENT_LABELS[order.paymentMethod]}</span>
          {order.paymentMethod === 'contra_entrega' && (
            <span className="ml-3 text-xs font-semibold text-ink">
              Adelanto: {formatPrice(order.payNow)} · Cobrar al entregar: {formatPrice(order.payOnDelivery)}
            </span>
          )}
          {order.couponCode && (
            <span className="ml-3 text-xs font-semibold text-primary">🎟️ Cupón: {order.couponCode}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {order.status === 'pendiente' && bankAccounts.length > 0 && (
            <a
              href={whatsappLinkTo(order.customer.phone, buildPaymentDataMessage(order, bankAccounts))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              💳 Enviar datos de pago
            </a>
          )}
          <a
            href={whatsappLinkTo(order.customer.phone, buildStatusMessage(order, storeName))}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            💬 Avisar por WhatsApp ({STATUSES.find((s) => s.value === order.status)?.label})
          </a>
        </div>
      </div>
    </div>
  );
}
