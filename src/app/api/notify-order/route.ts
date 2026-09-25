import { NextResponse } from 'next/server';

interface NotifyOrderItem {
  title: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

interface NotifyOrderBody {
  to: string;
  storeName: string;
  accentColor?: string;
  orderNumber: string;
  items: NotifyOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  payNow?: number;
  payOnDelivery?: number;
  paymentMethod: 'contra_entrega' | 'transferencia';
  customer: {
    name: string;
    phone: string;
    cedula?: string;
    address: string;
    reference?: string;
    city: string;
    province: string;
    note?: string;
  };
}

function formatUSD(value: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}

// Los datos del cliente vienen del formulario público — se escapan antes de
// meterlos en el HTML del correo.
function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const PAYMENT_LABELS: Record<NotifyOrderBody['paymentMethod'], string> = {
  contra_entrega: '💵 Pago contra entrega',
  transferencia: '🏦 Transferencia / depósito Banco Pichincha',
};

function buildEmailHtml(body: NotifyOrderBody): string {
  const accent = body.accentColor || '#B8923A';
  const itemsRows = body.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #EEE8DD;">
            <div style="font-weight:600;color:#1C1208;font-size:14px;">${esc(item.title)}</div>
            <div style="color:#8A7660;font-size:12px;margin-top:2px;">Talla ${esc(item.size)} · ${esc(item.color)} · x${esc(item.quantity)}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #EEE8DD;text-align:right;font-weight:600;color:#1C1208;font-size:14px;white-space:nowrap;">
            ${formatUSD(item.price * item.quantity)}
          </td>
        </tr>`,
    )
    .join('');

  return `
  <div style="background:#F5F1EA;padding:32px 16px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
      <div style="background:${accent};padding:24px 28px;">
        <p style="margin:0;color:#FFFFFF;font-size:13px;letter-spacing:0.04em;text-transform:uppercase;opacity:0.85;">${esc(body.storeName)}</p>
        <h1 style="margin:6px 0 0;color:#FFFFFF;font-size:22px;">🎉 Nuevo pedido recibido</h1>
      </div>

      <div style="padding:28px;">
        <p style="margin:0 0 4px;color:#8A7660;font-size:13px;">Número de pedido</p>
        <p style="margin:0 0 20px;color:#1C1208;font-size:20px;font-weight:700;">${esc(body.orderNumber)}</p>

        <p style="margin:0 0 4px;color:#8A7660;font-size:13px;">Método de pago</p>
        <p style="margin:0 0 20px;color:#1C1208;font-size:15px;font-weight:600;">${PAYMENT_LABELS[body.paymentMethod] ?? ''}</p>
        ${
          body.paymentMethod === 'contra_entrega'
            ? `<p style="margin:-12px 0 20px;color:#1C1208;font-size:13px;">Adelanto del envío: <b>${formatUSD(body.payNow ?? 0)}</b> · Cobrar al entregar: <b>${formatUSD(body.payOnDelivery ?? 0)}</b></p>`
            : ''
        }

        <table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
          ${itemsRows}
        </table>

        <table style="width:100%;border-collapse:collapse;margin-top:8px;">
          <tr>
            <td style="padding:4px 0;color:#8A7660;font-size:13px;">Subtotal</td>
            <td style="padding:4px 0;text-align:right;color:#1C1208;font-size:13px;">${formatUSD(body.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;color:#8A7660;font-size:13px;">Envío</td>
            <td style="padding:4px 0;text-align:right;color:#1C1208;font-size:13px;">${body.shipping === 0 ? 'GRATIS' : formatUSD(body.shipping)}</td>
          </tr>
          <tr>
            <td style="padding:10px 0 0;color:#1C1208;font-size:16px;font-weight:700;border-top:2px solid #1C1208;">Total</td>
            <td style="padding:10px 0 0;text-align:right;color:${accent};font-size:16px;font-weight:700;border-top:2px solid #1C1208;">${formatUSD(body.total)}</td>
          </tr>
        </table>

        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #EEE8DD;">
          <p style="margin:0 0 10px;color:#1C1208;font-size:14px;font-weight:700;">📦 Datos de entrega</p>
          <p style="margin:0;color:#1C1208;font-size:14px;line-height:1.6;">
            ${esc(body.customer.name)}${body.customer.cedula ? ` · C.I. ${esc(body.customer.cedula)}` : ''}<br/>
            📱 ${esc(body.customer.phone)}<br/>
            ${esc(body.customer.address)}, ${esc(body.customer.city)}, ${esc(body.customer.province)}
            ${body.customer.reference ? `<br/><span style="color:#8A7660;">Referencia: ${esc(body.customer.reference)}</span>` : ''}
            ${body.customer.note ? `<br/><span style="color:#8A7660;">Nota: ${esc(body.customer.note)}</span>` : ''}
          </p>
        </div>
      </div>

      <div style="background:#F5F1EA;padding:16px 28px;text-align:center;">
        <p style="margin:0;color:#8A7660;font-size:12px;">Notificación automática de ${esc(body.storeName)}</p>
      </div>
    </div>
  </div>`;
}

// Envía la notificación de pedido nuevo al correo de la tienda (equivalente
// al aviso que envía Shopify). Requiere RESEND_API_KEY configurada en el
// servidor — si falta, no rompe el checkout: simplemente no se envía nada.
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ skipped: true, reason: 'RESEND_API_KEY no configurada' });
  }

  const body = (await request.json().catch(() => null)) as NotifyOrderBody | null;
  if (!body?.to || !body.orderNumber || !body.items?.length) {
    return NextResponse.json({ error: 'Faltan datos del pedido.' }, { status: 400 });
  }

  const fromAddress = process.env.RESEND_FROM_EMAIL || 'Pedidos <onboarding@resend.dev>';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [body.to],
        subject: `🎉 Nuevo pedido ${body.orderNumber} — ${formatUSD(body.total)}`,
        html: buildEmailHtml(body),
      }),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      return NextResponse.json({ error: `Resend respondió ${res.status}: ${errorText}` }, { status: 502 });
    }

    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ error: 'No se pudo enviar el correo de notificación.' }, { status: 500 });
  }
}
