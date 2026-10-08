import sharp from 'sharp';
import { FIREBASE_CONFIG } from '@/lib/firebase-config';

// Sirve las fotos guardadas en Firestore (colección "images").
// Con ?w=ANCHO la entrega ya optimizada (WebP liviano del tamaño justo para
// la pantalla) — la tienda optimiza sus propias fotos, sin depender del
// optimizador de Vercel (que tiene un límite mensual en el plan gratuito).
// Cada foto nunca cambia (una foto nueva recibe un id nuevo), así que se
// guarda en caché un año en el navegador y en la CDN de Vercel.
export const runtime = 'nodejs';

const WIDTHS = [64, 96, 128, 180, 256, 384, 640, 828, 1080, 1200, 1600, 1920];
const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return new Response('Not found', { status: 404 });

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/images/${id}`,
    { next: { revalidate: 31536000 } },
  ).catch(() => null);
  // Firestore saturado o sin cuota: error temporal, sin guardarlo en caché
  // (si se respondiera 404 la foto quedaría rota en la CDN).
  if (!res || (!res.ok && res.status !== 404)) {
    return new Response('Temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } });
  }
  if (!res.ok) return new Response('Not found', { status: 404 });

  const json = (await res.json().catch(() => null)) as { fields?: Record<string, { bytesValue?: string; stringValue?: string }> } | null;
  const base64 = json?.fields?.data?.bytesValue;
  if (!base64) return new Response('Not found', { status: 404 });

  const contentType = json?.fields?.contentType?.stringValue || 'image/webp';
  const original = Buffer.from(base64, 'base64');

  // Foto optimizada al ancho pedido (se redondea a un tamaño estándar).
  const url = new URL(request.url);
  const wanted = Number(url.searchParams.get('w'));
  if (wanted > 0 && contentType.startsWith('image/') && contentType !== 'image/svg+xml') {
    const width = WIDTHS.find((w) => w >= wanted) ?? WIDTHS[WIDTHS.length - 1];
    const quality = Math.min(90, Math.max(40, Number(url.searchParams.get('q')) || 75));
    try {
      const out = await sharp(original).rotate().resize({ width, withoutEnlargement: true }).webp({ quality, effort: 3, smartSubsample: true }).toBuffer();
      return new Response(new Uint8Array(out), {
        headers: { 'Content-Type': 'image/webp', 'Content-Length': String(out.length), 'Cache-Control': CACHE },
      });
    } catch {
      // Si no se puede procesar, se entrega la original.
    }
  }

  return new Response(new Uint8Array(original), {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(original.length),
      ...(contentType === 'application/pdf' ? { 'Content-Disposition': 'inline; filename="guia.pdf"' } : {}),
      'Cache-Control': CACHE,
    },
  });
}
