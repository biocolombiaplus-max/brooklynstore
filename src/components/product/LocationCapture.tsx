'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function LocationCapture({
  value,
  onCapture,
}: {
  value: string;
  onCapture: (locationUrl: string) => void;
}) {
  const [status, setStatus] = useState<Status>(value ? 'success' : 'idle');

  function handleCapture() {
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onCapture(`https://www.google.com/maps?q=${latitude},${longitude}`);
        setStatus('success');
      },
      () => setStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-primary/60 bg-gold-50 p-3.5">
      <button
        type="button"
        onClick={handleCapture}
        disabled={status === 'loading'}
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold text-ink disabled:opacity-60"
      >
        <span>
          📍 {status === 'success' ? 'Ubicación confirmada' : 'Confirmar mi ubicación (recomendado)'}
        </span>
        <span className="text-xs font-bold text-primary">
          {status === 'loading' ? 'Obteniendo...' : status === 'success' ? '✓' : 'Compartir →'}
        </span>
      </button>
      <p className="mt-1 text-xs text-muted">
        {status === 'error'
          ? 'No pudimos obtener tu ubicación. Puedes continuar sin este paso.'
          : 'Ayuda a que tu pedido llegue exacto y más rápido. Totalmente opcional.'}
      </p>
      {status === 'success' && value && (
        <a href={value} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-primary hover:underline">
          Ver ubicación en el mapa →
        </a>
      )}
    </div>
  );
}
