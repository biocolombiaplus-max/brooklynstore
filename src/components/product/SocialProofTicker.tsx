'use client';

import { useEffect, useState } from 'react';

const NAMES = ['Andrés', 'Gabriela', 'Daniel', 'María José', 'Kevin', 'Valeria', 'Bryan', 'Doménica', 'Jonathan', 'Belén'];
const CITIES = ['Quito', 'Guayaquil', 'Cuenca', 'Ambato', 'Manta', 'Loja', 'Machala', 'Santo Domingo', 'Ibarra', 'Riobamba', 'Portoviejo'];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export default function SocialProofTicker({ productTitle }: { productTitle: string }) {
  const [visible, setVisible] = useState(false);
  const [entry, setEntry] = useState({ name: NAMES[0], city: CITIES[0], time: 3 });

  useEffect(() => {
    let hide: ReturnType<typeof setTimeout>;
    function showRandom() {
      setEntry({ name: pick(NAMES), city: pick(CITIES), time: Math.floor(Math.random() * 25) + 2 });
      setVisible(true);
      hide = setTimeout(() => setVisible(false), 5500);
    }
    const first = setTimeout(showRandom, 2500);
    const interval = setInterval(showRandom, 16000);
    return () => {
      clearTimeout(first);
      clearTimeout(hide);
      clearInterval(interval);
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-soft transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-50 text-lg">🛍️</span>
      <p className="text-xs text-ink sm:text-sm">
        <strong>{entry.name}</strong> de {entry.city} pidió <strong>{productTitle}</strong> hace {entry.time} min
      </p>
    </div>
  );
}
