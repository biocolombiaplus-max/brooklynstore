import { getImageVariant, ImageNotFound } from '@/lib/storeImages';

// Las fotos de la tienda se guardan en WebP (livianas para la web), pero los
// catálogos de Meta (Facebook / Instagram) y Google piden JPG. Esta ruta
// entrega la misma foto convertida a JPG cuadrado de 1080 px, fondo blanco,
// y la guarda en la CDN por un año (cada foto nunca cambia de id).
export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = params.id.replace(/\.jpe?g$/i, '');
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return new Response('Not found', { status: 404 });

  try {
    const jpg = await getImageVariant(id, { kind: 'jpg' });
    if (!jpg) return new Response('Not an image', { status: 415 });
    return new Response(new Uint8Array(jpg.data), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(jpg.data.length),
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    });
  } catch (err) {
    if (err instanceof ImageNotFound) return new Response('Not found', { status: 404 });
    // Firestore saturado o sin cuota: error temporal, sin guardarlo en caché.
    return new Response('Temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } });
  }
}
