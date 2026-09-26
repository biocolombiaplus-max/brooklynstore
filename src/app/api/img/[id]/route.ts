import { FIREBASE_CONFIG } from '@/lib/firebase-config';

// Sirve las fotos guardadas en Firestore (colección "images") cuando la
// tienda no usa Cloudinary. Cada foto nunca cambia (una foto nueva recibe un
// id nuevo), así que se guarda en caché por un año en el navegador y en la
// CDN de Vercel: Firestore casi no recibe lecturas.
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) return new Response('Not found', { status: 404 });

  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/images/${id}`,
    { next: { revalidate: 31536000 } },
  ).catch(() => null);
  if (!res || !res.ok) return new Response('Not found', { status: 404 });

  const json = (await res.json().catch(() => null)) as { fields?: Record<string, { bytesValue?: string; stringValue?: string }> } | null;
  const base64 = json?.fields?.data?.bytesValue;
  if (!base64) return new Response('Not found', { status: 404 });

  const contentType = json?.fields?.contentType?.stringValue || 'image/webp';
  const body = Buffer.from(base64, 'base64');
  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(body.length),
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
    },
  });
}
