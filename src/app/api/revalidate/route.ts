import { revalidatePath, revalidateTag } from 'next/cache';
import { isAdminRequest } from '@/lib/adminAuth';

// La tienda guarda productos y configuración en caché por una hora (así no
// agota la cuota diaria gratuita de Firestore). Cuando el admin guarda un
// cambio, el panel llama aquí y la tienda se actualiza al instante.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: 'unauthorized' }, { status: 401 });
  revalidateTag('products');
  revalidateTag('settings');
  revalidatePath('/', 'layout');
  return Response.json({ ok: true });
}
