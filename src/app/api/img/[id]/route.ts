import { getImageVariant, ImageNotFound, loadOriginalImage, type StoredImage } from '@/lib/storeImages';

// Sirve las fotos guardadas en Firestore (colección "images").
// Con ?w=ANCHO la entrega ya optimizada (WebP liviano del tamaño justo para
// la pantalla) — la tienda optimiza sus propias fotos, sin depender del
// optimizador de Vercel (que tiene un límite mensual en el plan gratuito).
// Cada foto nunca cambia (una foto nueva recibe un id nuevo), así que se
// guarda en caché un año en el navegador y en la CDN de Vercel, y la versión
// optimizada queda guardada para siempre en el servidor (ver storeImages.ts).
export const runtime = 'nodejs';

const WIDTHS = [64, 96, 128, 180, 256, 384, 640, 828, 1080, 1200, 1600, 1920];
const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

function send(img: StoredImage) {
  return new Response(new Uint8Array(img.data), {
    headers: {
      'Content-Type': img.contentType,
      'Content-Length': String(img.data.length),
      ...(img.contentType === 'application/pdf' ? { 'Content-Disposition': 'inline; filename="guia.pdf"' } : {}),
      'Cache-Control': CACHE,
    },
  });
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return new Response('Not found', { status: 404 });

  const url = new URL(request.url);
  const wanted = Number(url.searchParams.get('w'));
  try {
    if (wanted > 0) {
      const width = WIDTHS.find((w) => w >= wanted) ?? WIDTHS[WIDTHS.length - 1];
      const quality = Math.min(90, Math.max(40, Number(url.searchParams.get('q')) || 70));
      const variant = await getImageVariant(id, { kind: 'webp', width, quality }).catch((err) => {
        if (err instanceof ImageNotFound) throw err;
        return undefined;
      });
      if (variant) return send(variant);
      // undefined: no se pudo procesar → se intenta con la original.
      // null: no es una imagen (PDF, SVG) → se entrega la original.
    }
    return send(await loadOriginalImage(id));
  } catch (err) {
    if (err instanceof ImageNotFound) return new Response('Not found', { status: 404 });
    // Firestore saturado o sin cuota: error temporal, sin guardarlo en caché
    // (si se respondiera 404 la foto quedaría rota en la CDN).
    return new Response('Temporarily unavailable', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '5' } });
  }
}
