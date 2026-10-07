'use client';

import { useEffect, useState } from 'react';

// Fecha estimada de entrega (como Amazon o Nike): real y útil, en vez de un
// contador de "oferta" que se reinicia cada noche. Cuenta días hábiles
// (sin domingos) a partir de mañana.
function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) added++;
  }
  return d;
}

const label = (d: Date) => d.toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');

export default function DeliveryEstimate({ minDays = 1, maxDays = 3 }: { minDays?: number; maxDays?: number }) {
  const [range, setRange] = useState<[string, string] | null>(null);

  useEffect(() => {
    const now = new Date();
    setRange([label(addBusinessDays(now, minDays)), label(addBusinessDays(now, maxDays))]);
  }, [minDays, maxDays]);

  if (!range) return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-white">
      <span className="text-xl">📦</span>
      <p className="text-xs leading-snug sm:text-sm">
        Pide hoy y recíbelo entre el <strong className="text-primary-light">{range[0]}</strong> y el{' '}
        <strong className="text-primary-light">{range[1]}</strong>
        <span className="block text-[11px] text-white/55">Envío con Servientrega a todo Ecuador · con número de guía</span>
      </p>
    </div>
  );
}
