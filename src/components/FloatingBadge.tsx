'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// Insignia flotante de ofertas (esquina inferior izquierda).
export default function FloatingBadge({ href = '/catalogo?ofertas=1' }: { href?: string }) {
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();
  const hidden = pathname?.startsWith('/producto/') || pathname?.startsWith('/checkout') || pathname?.startsWith('/pedido-confirmado');
  if (dismissed || hidden) return null;

  return (
    <div className="fixed bottom-5 left-4 z-30 hidden animate-popIn sm:bottom-6 sm:left-6 sm:block">
      <div className="relative animate-float">
        <Link
          href={href}
          className="relative flex h-[4.5rem] w-[4.5rem] flex-col items-center justify-center overflow-hidden rounded-full bg-ink shadow-dark ring-2 ring-primary transition-transform hover:scale-105"
        >
          <span className="pointer-events-none absolute inset-0 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          <span className="relative text-xl leading-none">🔥</span>
          <span className="relative mt-0.5 text-[10px] font-black uppercase tracking-widest text-primary-light">Ofertas</span>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Cerrar"
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] text-ink shadow-soft"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
