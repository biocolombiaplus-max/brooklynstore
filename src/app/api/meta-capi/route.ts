import { createHash } from 'crypto';
import { NextResponse } from 'next/server';
import { getSiteSettingsServer } from '@/lib/settingsServer';

// API de conversiones de Meta: el servidor le avisa a Meta cada evento de la
// tienda (con el mismo event_id que el Píxel, para que no se cuente doble).
// Se activa sola cuando existe la variable META_CAPI_TOKEN en Vercel.
// Los datos personales viajan cifrados (SHA-256), como exige Meta.

const ALLOWED = new Set(['PageView', 'ViewContent', 'Search', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Contact', 'CustomizeProduct']);
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';
const GRAPH_BASE = process.env.META_GRAPH_BASE_URL || 'https://graph.facebook.com';

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');
const clean = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');

// Celular de Ecuador en formato internacional: 0991234567 → 593991234567.
function normalizePhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('593')) return d;
  if (d.startsWith('0')) d = d.slice(1);
  return d.length >= 8 ? `593${d}` : '';
}

function normalizeName(raw: string): string {
  return raw
    .trim()
    .split(/\s+/)[0]
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function pickCustomData(d: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  if (typeof d.value === 'number' && Number.isFinite(d.value)) out.value = d.value;
  if (typeof d.currency === 'string') out.currency = d.currency.slice(0, 3);
  if (Array.isArray(d.content_ids)) out.content_ids = d.content_ids.slice(0, 20).map((x) => String(x).slice(0, 100));
  if (typeof d.content_type === 'string') out.content_type = d.content_type.slice(0, 20);
  if (typeof d.content_name === 'string') out.content_name = d.content_name.slice(0, 150);
  if (typeof d.content_category === 'string') out.content_category = d.content_category.slice(0, 100);
  if (typeof d.search_string === 'string') out.search_string = d.search_string.slice(0, 100);
  if (typeof d.num_items === 'number') out.num_items = d.num_items;
  if (Array.isArray(d.contents))
    out.contents = d.contents.slice(0, 20).map((c) => ({
      id: String((c as { id?: unknown })?.id ?? '').slice(0, 100),
      quantity: Number((c as { quantity?: unknown })?.quantity) || 1,
      ...(typeof (c as { item_price?: unknown })?.item_price === 'number' ? { item_price: (c as { item_price: number }).item_price } : {}),
    }));
  return out;
}

export async function POST(req: Request) {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) return new NextResponse(null, { status: 204 }); // Aún no configurado: no hace nada.

  const body = (await req.json().catch(() => null)) as {
    event_name?: string;
    event_id?: string;
    event_source_url?: string;
    custom_data?: Record<string, unknown>;
    user_data?: Record<string, unknown>;
  } | null;
  if (!body?.event_name || !ALLOWED.has(body.event_name) || !body.event_id) return NextResponse.json({ ok: false }, { status: 400 });

  const pixelId = process.env.META_PIXEL_ID || (await getSiteSettingsServer()).metaPixelId;
  if (!pixelId) return new NextResponse(null, { status: 204 });

  const u = body.user_data ?? {};
  const phone = normalizePhone(clean(u.phone, 30));
  const name = normalizeName(clean(u.name, 80));
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const user_data: Record<string, unknown> = {
    client_user_agent: req.headers.get('user-agent') ?? '',
    country: [sha256('ec')],
    ...(ip ? { client_ip_address: ip } : {}),
    ...(clean(u.fbp) ? { fbp: clean(u.fbp) } : {}),
    ...(clean(u.fbc) ? { fbc: clean(u.fbc) } : {}),
    ...(clean(u.external_id, 60) ? { external_id: [sha256(clean(u.external_id, 60))] } : {}),
    ...(phone ? { ph: [sha256(phone)] } : {}),
    ...(name ? { fn: [sha256(name)] } : {}),
  };

  const event = {
    event_name: body.event_name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: clean(body.event_id, 100),
    event_source_url: clean(body.event_source_url, 500),
    action_source: 'website',
    user_data,
    custom_data: pickCustomData(body.custom_data ?? {}),
  };

  const res = await fetch(`${GRAPH_BASE}/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [event], ...(process.env.META_CAPI_TEST_CODE ? { test_event_code: process.env.META_CAPI_TEST_CODE } : {}) }),
    cache: 'no-store',
  }).catch(() => null);

  if (res && !res.ok) console.error('meta-capi', res.status, (await res.text().catch(() => '')).slice(0, 300));
  return NextResponse.json({ ok: !!res?.ok }, { status: res?.ok ? 200 : 202 });
}
