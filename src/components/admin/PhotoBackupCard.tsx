'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebase';
import { isMirrorEnabled } from '@/lib/cloudinaryMirror';
import type { SiteSettings } from '@/lib/types';

// Copia todas las fotos de la tienda (productos y configuración) a
// Cloudinary, para que sigan viéndose aunque Firestore se quede sin cuota.
// Las fotos nuevas se copian solas al subirlas; esto es para las de antes.
export default function PhotoBackupCard({ settings }: { settings: SiteSettings }) {
  const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0, copied: 0, failed: 0 });
  const [error, setError] = useState('');

  async function run() {
    setError('');
    setStatus('running');
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error('Vuelve a iniciar sesión en el panel.');
      const { getAllProducts } = await import('@/lib/products');
      const products = await getAllProducts();
      const text = JSON.stringify([products, settings]);
      const ids = Array.from(new Set(Array.from(text.matchAll(/\/api\/img\/([A-Za-z0-9]{10,40})/g), (m) => m[1])));
      const totals = { done: 0, total: ids.length, copied: 0, failed: 0 };
      setProgress({ ...totals });
      for (let i = 0; i < ids.length; i += 6) {
        const batch = ids.slice(i, i + 6);
        const res = await fetch('/api/img-backup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ids: batch }),
        });
        const data = (await res.json().catch(() => null)) as { results?: Record<string, string> } | null;
        const results = Object.values(data?.results ?? {});
        totals.done += batch.length;
        totals.copied += results.filter((r) => r === 'copied').length;
        totals.failed += res.ok ? results.filter((r) => r === 'failed').length : batch.length;
        setProgress({ ...totals });
      }
      setStatus('done');
    } catch (err) {
      setError((err as Error).message || 'No se pudo completar el respaldo.');
      setStatus('idle');
    }
  }

  if (!isMirrorEnabled()) {
    return (
      <div className="rounded-card border-2 border-dashed border-primary/40 bg-white p-4 text-sm">
        <p className="font-bold text-ink">☁️ Respaldo de fotos en Cloudinary: desactivado</p>
        <p className="mt-1 text-xs text-muted">
          Agrega en Vercel las variables NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET y vuelve a
          desplegar. Así cada foto queda con doble copia y nunca deja de verse.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-primary/40 bg-white p-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-ink">☁️ Respaldo de fotos en Cloudinary: activo</p>
        <p className="text-xs text-muted">
          Las fotos nuevas se respaldan solas. Usa este botón una vez para copiar las fotos que ya tenías.
        </p>
        {progress.total > 0 && (
          <p className="mt-1 text-xs font-bold text-ink">
            {status === 'done' ? '✅ Listo: ' : 'Respaldando… '}
            {progress.done}/{progress.total} revisadas · {progress.copied} copiadas
            {progress.failed > 0 && <span className="text-urgent"> · {progress.failed} pendientes (vuelve a intentar más tarde)</span>}
          </p>
        )}
        {error && <p className="mt-1 text-xs font-bold text-urgent">{error}</p>}
      </div>
      <button
        type="button"
        onClick={run}
        disabled={status === 'running'}
        className="shrink-0 whitespace-nowrap rounded-lg bg-ink px-4 py-2.5 text-sm font-bold text-white shadow-soft disabled:opacity-60"
      >
        {status === 'running' ? 'Respaldando…' : 'Respaldar fotos'}
      </button>
    </div>
  );
}
