// Respaldo de las fotos de la tienda en Cloudinary (plan gratis, sin tarjeta).
//
// Las fotos se guardan en Firestore (colección "images") y además se copian a
// Cloudinary con el nombre "bs_<id>". Si Firestore se queda sin cuota o
// falla, la tienda las sirve desde Cloudinary: dos copias independientes,
// así una foto nunca deja de verse. Se activa solo con las variables
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET.

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export const isMirrorEnabled = (): boolean => !!CLOUD && !!PRESET;

export const mirrorUrl = (id: string): string => `https://res.cloudinary.com/${CLOUD}/image/upload/bs_${id}`;

// Sube la copia. "file" puede ser un Blob (navegador) o un data URI (servidor).
// Si la copia ya existe, Cloudinary responde con error y se toma como hecho.
export async function uploadMirror(id: string, file: Blob | string, timeoutMs = 20000): Promise<boolean> {
  if (!isMirrorEnabled()) return false;
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', PRESET as string);
  form.append('public_id', `bs_${id}`);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
      method: 'POST',
      body: form,
      signal: controller.signal,
      cache: 'no-store',
    });
    if (res.ok) return true;
    const data = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    return /already exists/i.test(data?.error?.message ?? '');
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
