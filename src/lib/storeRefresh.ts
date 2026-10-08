import { auth } from './firebase';

// Avisa al servidor que hubo cambios en el panel para que la tienda deje de
// mostrar la versión en caché. Se agrupan los guardados seguidos (subidas
// múltiples, autoguardado) en un solo aviso.
let timer: ReturnType<typeof setTimeout> | undefined;

export function refreshStore(): void {
  if (typeof window === 'undefined') return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) return;
      await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch {
      // Sin aviso: la tienda se refresca sola al vencer la caché.
    }
  }, 1500);
}
