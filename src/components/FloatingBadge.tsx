'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

// Acceso flotante a ofertas. Solo aparece cuando el cliente ya pasó la
// portada (así nunca tapa el título, los botones ni los sellos de confianza)
// y se esconde al llegar al pie de página. En celular es una píldora
// compacta; en PC, la insignia redonda.
export default function FloatingBadge({ href = '/catalogo?ofertas=1' }: { href?: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const pathname = usePathname();
  const hidden = pathname?.startsWith('/producto/') || pathname?.startsWith('/checkout') || pathname?.startsWith('/pedido-confirmado');

  useEffect(() => {
    function onScroll() {
      const pastHero = window.scrollY > window.innerHeight * 0.9;
      const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 700;
      setVisible(pastHero && !nearBottom);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  if (dismissed || hidden || !visible) return null;

  return (
    <div className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-4 z-30 animate-popIn sm:bottom-6 sm:left-6">
      {/* Celular: píldora compacta */}
      <div className="relative sm:hidden">
        <Link
          href={href}
          className="relative flex h-11 items-center gap-1.5 overflow-hidden rounded-full bg-ink pl-3.5 pr-9 text-[11px] font-extrabold uppercase tracking-wider text-primary-light shadow-dark ring-1 ring-primary/70"
        >
          <span className="pointer-events-none absolute inset-0 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <span className="relative">🔥 Ofertas</span>
        </Link>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Cerrar"
          className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-[11px] text-white"
        >
          ✕
        </button>
      </div>

      {/* PC: insignia redonda */}
      <div className="relative hidden animate-float sm:block">
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
