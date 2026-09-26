'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllOrders, updateOrderStatus, updateOrderShipping, deleteOrder } from '@/lib/orders';
import { getSiteSettings } from '@/lib/settings';
import { CARRIERS, type Order, type OrderStatus, type Carrier, type BankAccount } from '@/lib/types';
import { buildPaymentDataMessage, formatPrice, whatsappLinkTo } from '@/lib/utils';

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
    case 'enviado': {
      const shippingInfo =
        order.carrier && order.trackingNumber
          ? `\n\nTransportadora: ${order.carrier}\nNúmero de guía: ${order.trackingNumber}`
          : '';
      return `Hola ${firstName}! Tu pedido ${order.orderNumber} ya salió hacia ${order.customer.city}.${shippingInfo}\n\nCualquier novedad con la entrega, escríbenos por este mismo medio.`;
    }
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
  onDelete,
}: {
  order: Order;
  storeName: string;
  bankAccounts: BankAccount[];
  saving: boolean;
  onStatusChange: (status: OrderStatus) => void;
  onShippingSave: (carrier: Carrier | '', trackingNumber: string) => void;
  onDelete: () => void;
}) {
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
          <ul className="space-y-1 text-sm text-ink">
            {order.items.map((item, i) => (
              <li key={i}>
                {item.title} (T.{item.size}{item.sizeUs ? ` · US ${item.sizeUs}` : ''}, {item.color}) × {item.quantity}
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
