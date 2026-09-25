'use client';

import { useId } from 'react';
import { classNames } from '@/lib/utils';

// Sello circular de lujo para la marca estrella: anillo dorado fino con el
// texto girando lentamente alrededor y "Nº1" al centro, al estilo de las
// etiquetas de marcas premium.
export default function StarSeal({ label = 'Más vendida', className }: { label?: string; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pathId = `seal-path-${uid}`;
  const goldId = `seal-gold-${uid}`;
  const ringText = `${label} · Brooklyn Store · ${label} · Nº1 en ventas · `.toUpperCase();
  return (
    <span className={classNames('inline-flex aspect-square items-center justify-center', className?.includes('absolute') ? '' : 'relative', className)} aria-label={`${label} — Nº1 en ventas`}>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full animate-spin-slow [animation-duration:18s]" aria-hidden>
        <defs>
          <path id={pathId} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          <linearGradient id={goldId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F1DC9A" />
            <stop offset="45%" stopColor="#C9A646" />
            <stop offset="100%" stopColor="#8C6A22" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill="#0B0B0B" />
        <circle cx="100" cy="100" r="95" fill="none" stroke={`url(#${goldId})`} strokeWidth="1.5" />
        <circle cx="100" cy="100" r="62" fill="none" stroke={`url(#${goldId})`} strokeWidth="1" opacity="0.7" />
        <text fill={`url(#${goldId})`} fontSize="13.5" fontWeight="700" letterSpacing="3.2" fontFamily="Montserrat, sans-serif">
          <textPath href={`#${pathId}`}>{ringText}</textPath>
        </text>
      </svg>
      <span className="relative flex flex-col items-center leading-none">
        <span className="font-display text-[0.9em] italic text-primary-light">Nº</span>
        <span className="font-display text-[2.1em] font-bold text-gold-gradient">1</span>
      </span>
    </span>
  );
}
