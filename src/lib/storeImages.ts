import sharp from 'sharp';
import { unstable_cache } from 'next/cache';
import { FIREBASE_CONFIG } from './firebase-config';
import { isMirrorEnabled, mirrorUrl, uploadMirror } from './cloudinaryMirror';

// Fotos de la tienda guardadas en Firestore (colección "images").
//
// Cada foto original pesa hasta ~1 MB y leerla gasta cuota de Firestore
// (lecturas y transferencia). Por eso cada versión optimizada (WebP del
// ancho justo o JPG para Meta, ~20-80 KB) se guarda para siempre en la
// caché de datos de Vercel, que sobrevive a cada despliegue: Firestore se
// consulta UNA sola vez por foto y tamaño, y aunque Firestore se quede sin
// cuota las fotos ya generadas se siguen viendo.

export class ImageNotFound extends Error {}
export class ImageUnavailable extends Error {}

export type StoredImage = { data: Buffer; contentType: string };

// Copia de respaldo en Cloudinary (si está configurado). null si no existe.
async function loadFromMirror(id: string): Promise<StoredImage | null> {
  if (!isMirrorEnabled()) return null;
  // Sin caché de fetch: un "no existe" no debe quedar guardado (la copia puede
  // crearse después). Las versiones optimizadas ya quedan guardadas aparte.
  const res = await fetch(mirrorUrl(id), { cache: 'no-store' }).catch(() => null);
  if (!res?.ok) return null;
  const contentType = res.headers.get('content-type') || 'image/webp';
  return { data: Buffer.from(await res.arrayBuffer()), contentType };
}

// Primero la copia de Cloudinary (no gasta cuota de Firestore); si no existe,
// Firestore, y de paso se crea la copia para la próxima vez.
export async function loadOriginalImage(id: string): Promise<StoredImage> {
  const mirrored = await loadFromMirror(id);
  if (mirrored) return mirrored;
  const original = await loadFromFirestore(id);
  if (isMirrorEnabled() && original.contentType.startsWith('image/') && original.contentType !== 'image/svg+xml') {
    await uploadMirror(id, `data:${original.contentType};base64,${original.data.toString('base64')}`, 6000);
  }
  return original;
}

export async function loadFromFirestore(id: string): Promise<StoredImage> {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/images/${id}`,
    { next: { revalidate: 31536000 } },
  ).catch(() => null);
  // Firestore saturado o sin cuota: error temporal (nunca se guarda como 404).
  if (!res || (!res.ok && res.status !== 404)) throw new ImageUnavailable();
  if (!res.ok) throw new ImageNotFound();
  const json = (await res.json().catch(() => null)) as { fields?: Record<string, { bytesValue?: string; stringValue?: string }> } | null;
  const base64 = json?.fields?.data?.bytesValue;
  if (!base64) throw new ImageNotFound();
  return { data: Buffer.from(base64, 'base64'), contentType: json?.fields?.contentType?.stringValue || 'image/webp' };
}

type Variant = { kind: 'webp'; width: number; quality: number } | { kind: 'jpg' };

async function renderVariant(id: string, variant: Variant): Promise<{ b64: string; contentType: string } | null> {
  const original = await loadOriginalImage(id);
  if (!original.contentType.startsWith('image/') || original.contentType === 'image/svg+xml') return null;
  const img = sharp(original.data).rotate();
  const out =
    variant.kind === 'jpg'
      ? await img
          .resize(1080, 1080, { fit: 'contain', background: '#FFFFFF' })
          .flatten({ background: '#FFFFFF' })
          .jpeg({ quality: 86, mozjpeg: true })
          .toBuffer()
      : await img
          .resize({ width: variant.width, withoutEnlargement: true })
          .webp({ quality: variant.quality, effort: 3, smartSubsample: true })
          .toBuffer();
  return { b64: out.toString('base64'), contentType: variant.kind === 'jpg' ? 'image/jpeg' : 'image/webp' };
}

// Si renderVariant lanza un error (Firestore sin cuota, foto inexistente)
// no se guarda nada y se reintenta en la próxima visita.
const cachedVariant = unstable_cache(
  async (id: string, key: string) => renderVariant(id, JSON.parse(key) as Variant),
  ['store-image-variant-v1'],
  { revalidate: false },
);

export async function getImageVariant(id: string, variant: Variant): Promise<StoredImage | null> {
  const hit = await cachedVariant(id, JSON.stringify(variant));
  return hit ? { data: Buffer.from(hit.b64, 'base64'), contentType: hit.contentType } : null;
}
