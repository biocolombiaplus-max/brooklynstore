'use client';

import { useEffect, useState } from 'react';

// Cuenta regresiva hasta la medianoche: "la oferta de hoy termina en...".
function secondsUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

export default function UrgencyTimer() {
  const [seconds, setSeconds] = useState<number | null>(null);

  useEffect(() => {
    setSeconds(secondsUntilMidnight());
    const interval = setInterval(() => setSeconds(secondsUntilMidnight()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (seconds === null) return null;
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-white">
      <span className="flex items-center gap-2 text-xs font-bold sm:text-sm">
        <span className="h-2 w-2 animate-pulseSoft rounded-full bg-urgent" />
        ⏰ El precio de hoy termina en
      </span>
      <span className="flex gap-1 font-mono text-base font-black text-primary-light sm:text-lg">
        {[h, m, s].map((v, i) => (
          <span key={i} className="flex items-center gap-1">
            <span className="rounded-md bg-white/10 px-1.5 py-0.5">{v}</span>
            {i < 2 && ':'}
          </span>
        ))}
      </span>
    </div>
  );
}
