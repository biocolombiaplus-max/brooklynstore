import { NextResponse } from 'next/server';
import { FIREBASE_CONFIG } from '@/lib/firebase-config';

// Recibe la actividad de cada visitante (páginas, zapatos vistos, carrito,
// pago) y la guarda en Firestore (colección "visitors") con la ciudad que
// detecta Vercel. Es lo que alimenta el panel "Visitantes en vivo".

const STAGES = ['visita', 'producto', 'carrito', 'checkout', 'compra'];

type FsValue = Record<string, unknown>;

function toValue(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') {
    const fields: Record<string, FsValue> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) if (val !== undefined) fields[k] = toValue(val);
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function cleanProducts(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 6).map((p) => ({ slug: str(p?.slug, 120), title: str(p?.title, 120), image: str(p?.image, 300) }));
}

function cleanCart(v: unknown) {
  if (!Array.isArray(v)) return [];
  return v.slice(0, 15).map((i) => {
    const item: Record<string, unknown> = {
      productId: str(i?.productId, 60),
      slug: str(i?.slug, 120),
      title: str(i?.title, 120),
      image: str(i?.image, 300),
      size: str(i?.size, 20),
      color: str(i?.color, 60),
      quantity: Math.max(1, Math.min(20, Math.round(num(i?.quantity)) || 1)),
      price: num(i?.price),
    };
    if (i?.sizeUs) item.sizeUs = str(i.sizeUs, 10);
    if (i?.codPrice) item.codPrice = num(i.codPrice);
    if (i?.brand) item.brand = str(i.brand, 60);
    if (i?.metaId) item.metaId = str(i.metaId, 100);
    return item;
  });
}

function header(req: Request, name: string): string {
  const raw = req.headers.get(name) ?? '';
  try {
    return decodeURIComponent(raw).slice(0, 60);
  } catch {
    return raw.slice(0, 60);
  }
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { vid?: string; pageview?: boolean; path?: string; data?: Record<string, unknown> } | null;
  const vid = body?.vid ?? '';
  if (!/^[a-f0-9]{24}$/.test(vid) || !body?.data) return NextResponse.json({ ok: false }, { status: 400 });
  const d = body.data;

  const fields: Record<string, unknown> = {
    firstSeen: num(d.firstSeen) || Date.now(),
    visits: Math.max(1, Math.round(num(d.visits))),
    lastPath: str(body.path, 120),
    landing: str(d.landing, 120),
    source: str(d.source, 40) || 'Directo',
    campaign: str(d.campaign, 120),
    device: str(d.device, 30),
    products: cleanProducts(d.products),
    cart: cleanCart(d.cart),
    cartValue: num(d.cartValue),
    stage: STAGES.includes(d.stage as string) ? d.stage : 'visita',
    stageAt: num(d.stageAt) || Date.now(),
    name: str(d.name, 80),
    phone: str(d.phone, 20),
    orderNumber: str(d.orderNumber, 40),
  };
  const city = header(req, 'x-vercel-ip-city');
  if (city) {
    fields.city = city;
    fields.region = header(req, 'x-vercel-ip-country-region');
  }

  const projectId = FIREBASE_CONFIG.projectId;
  const docName = `projects/${projectId}/databases/(default)/documents/visitors/${vid}`;
  const transforms: Record<string, unknown>[] = [{ fieldPath: 'lastSeen', setToServerValue: 'REQUEST_TIME' }];
  if (body.pageview) transforms.push({ fieldPath: 'pageviews', increment: { integerValue: '1' } });

  const res = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      writes: [
        {
          update: { name: docName, fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, toValue(v)])) },
          updateMask: { fieldPaths: Object.keys(fields) },
          updateTransforms: transforms,
        },
      ],
    }),
    cache: 'no-store',
  }).catch(() => null);

  if (res && !res.ok) console.error('track: Firestore', res.status, (await res.text().catch(() => '')).slice(0, 300));
  return NextResponse.json({ ok: !!res?.ok }, { status: res?.ok ? 200 : 202 });
}
