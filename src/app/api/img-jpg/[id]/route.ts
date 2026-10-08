import sharp from 'sharp';
import { FIREBASE_CONFIG } from '@/lib/firebase-config';

// Las fotos de la tienda se guardan en WebP (livianas para la web), pero los
// catálogos de Meta (Facebook / Instagram) y Google piden JPG. Esta ruta
// entrega la misma foto convertida a JPG cuadrado de 1080 px, fondo blanco,
// y la guarda en la CDN por un año (cada foto nunca cambia de id).
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = params.id.replace(/\.jpe?g$/i, '');
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

  const json = (await res.json().catch(() => null)) as { fields?: Record<string, { bytesValue?: string }> } | null;
  const base64 = json?.fields?.data?.bytesValue;
  if (!base64) return new Response('Not found', { status: 404 });

  try {
    const jpg = await sharp(Buffer.from(base64, 'base64'))
      .rotate()
      .resize(1080, 1080, { fit: 'contain', background: '#FFFFFF' })
      .flatten({ background: '#FFFFFF' })
      .jpeg({ quality: 86, mozjpeg: true })
      .toBuffer();
    return new Response(new Uint8Array(jpg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(jpg.length),
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    });
  } catch {
    return new Response('Not an image', { status: 415 });
  }
}
