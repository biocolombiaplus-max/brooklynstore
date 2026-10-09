import { isAdminRequest } from '@/lib/adminAuth';
import { isMirrorEnabled, mirrorUrl, uploadMirror } from '@/lib/cloudinaryMirror';
import { ImageNotFound, loadFromFirestore } from '@/lib/storeImages';

// Copia a Cloudinary las fotos que todavía solo están en Firestore (botón
// "Respaldar fotos" del panel). Recibe hasta 10 ids por llamada.
export const runtime = 'nodejs';
export const maxDuration = 60;

type Result = 'ok' | 'copied' | 'missing' | 'failed';

async function backup(id: string): Promise<Result> {
  const head = await fetch(mirrorUrl(id), { method: 'HEAD', cache: 'no-store' }).catch(() => null);
  if (head?.ok) return 'ok';
  try {
    const img = await loadFromFirestore(id);
    if (!img.contentType.startsWith('image/') || img.contentType === 'image/svg+xml') return 'ok';
    const done = await uploadMirror(id, `data:${img.contentType};base64,${img.data.toString('base64')}`);
    return done ? 'copied' : 'failed';
  } catch (err) {
    return err instanceof ImageNotFound ? 'missing' : 'failed';
  }
}

export async function POST(request: Request) {
  if (!isMirrorEnabled()) return Response.json({ error: 'not_configured' }, { status: 503 });
  if (!(await isAdminRequest(request))) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = (Array.isArray(body?.ids) ? body.ids : [])
    .map(String)
    .filter((id) => /^[A-Za-z0-9]{10,40}$/.test(id))
    .slice(0, 10);
  const results: Record<string, Result> = {};
  await Promise.all(ids.map(async (id) => (results[id] = await backup(id))));
  return Response.json({ results });
}
