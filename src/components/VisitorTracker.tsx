'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { trackPageview, trackVisitorCart } from '@/lib/visitor';

// Registra cada página vista y cada cambio del carrito para el panel
// "Visitantes en vivo".
export default function VisitorTracker() {
  const pathname = usePathname();
  const items = useCartStore((s) => s.items);
  const lastCart = useRef<string | null>(null);

  useEffect(() => {
    trackPageview();
  }, [pathname]);

  useEffect(() => {
    const key = JSON.stringify(items.map((i) => [i.productId, i.size, i.color, i.quantity]));
    if (lastCart.current === null) {
      lastCart.current = key; // Al cargar: no es un cambio del carrito.
      if (items.length === 0) return;
    } else if (lastCart.current === key) return;
    lastCart.current = key;
    trackVisitorCart(items);
  }, [items]);

  return null;
}
