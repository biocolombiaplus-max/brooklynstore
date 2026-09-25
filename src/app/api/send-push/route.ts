import { NextResponse } from 'next/server';
import { FIREBASE_CONFIG } from '@/lib/firebase-config';
import webpush from 'web-push';

// Lee la colección de suscripciones push vía la API REST de Firestore (esta
// ruta corre en el servidor y no puede usar el SDK de cliente de Firebase,
// igual que src/lib/branding.ts). La regla de seguridad permite lectura
// pública de "pushSubscriptions" para que este endpoint funcione sin
// credenciales de servidor adicionales.
function unwrapValue(value: any): any {
  if (value == null) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value) return unwrapFields(value.mapValue.fields ?? {});
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(unwrapValue);
  return null;
}

function unwrapFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) result[key] = unwrapValue(value);
  return result;
}

interface StoredSubscription {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

async function loadSubscriptions(): Promise<StoredSubscription[]> {
  const projectId = FIREBASE_CONFIG.projectId;
  if (!projectId) return [];

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/pushSubscriptions`,
    { cache: 'no-store' },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return (data.documents ?? []).map((doc: any) => unwrapFields(doc.fields ?? {}));
}

// Envía la notificación push de "pedido nuevo" a todos los celulares de la
// administradora que hayan activado los avisos — llega como notificación
// del sistema aunque la tienda no esté abierta, igual que la app de
// Shopify. Nunca debe romper el checkout: si falta configurar las llaves
// VAPID o algo falla, simplemente no se envía nada.
export async function POST(request: Request) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ skipped: true, reason: 'VAPID no configurado' });
  }

  const body = await request.json().catch(() => null);
  const { title, bodyText, url } = body ?? {};
  if (!title) {
    return NextResponse.json({ error: 'Falta el título de la notificación.' }, { status: 400 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:brooklynstore.ec@gmail.com',
    publicKey,
    privateKey,
  );

  const subscriptions = await loadSubscriptions();
  const payload = JSON.stringify({ title, body: bodyText, url: url || '/admin/pedidos' });

  const results = await Promise.allSettled(
    subscriptions
      .filter((s): s is Required<StoredSubscription> => !!s.endpoint && !!s.keys?.p256dh && !!s.keys?.auth)
      .map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys } as any, payload, {
          // "urgency: high" le pide a Android/Chrome que despierte el
          // teléfono y entregue la notificación de inmediato, en vez de
          // agruparla con el ahorro de batería — clave para que realmente
          // suene y vibre apenas entra el pedido, no minutos después.
          urgency: 'high',
          TTL: 60,
        }),
      ),
  );

  const sent = results.filter((r) => r.status === 'fulfilled').length;
  // Si algo falló, se devuelve el motivo real del primer error (ej: "410
  // Gone" = la suscripción quedó vieja/inválida y hay que reactivarla en
  // ese celular; esto pasa sobre todo si alguien activó las notificaciones
  // ANTES de terminar de configurar las llaves VAPID en Vercel) — así el
  // botón de prueba en el admin puede explicar el problema real, no solo
  // decir "no llegó".
  const firstError = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  const errorDetail = firstError
    ? `${firstError.reason?.statusCode ?? ''} ${firstError.reason?.body ?? firstError.reason?.message ?? ''}`.trim()
    : undefined;

  return NextResponse.json({ sent, total: subscriptions.length, ...(errorDetail ? { errorDetail } : {}) });
}
