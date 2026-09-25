'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import SafeImage from '@/components/SafeImage';

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(false);
  const { items, clear } = useCartStore();
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && !done && items.length === 0) router.replace('/carrito');
  }, [mounted, done, items.length, router]);

  if (!mounted || items.length === 0) return null;

  return (
    <div className="container-page py-8 sm:py-12">
      <p className="section-eyebrow">🔒 Compra segura</p>
      <h1 className="section-title mt-2">Finalizar compra</h1>
      <p className="mt-2 text-sm text-muted">3 pasos rapidito y confirmas tu pedido por WhatsApp.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
        <div className="order-2 lg:order-1">
          <CheckoutForm
            items={items}
            onSuccess={(id) => {
              setDone(true);
              clear();
              router.push(`/pedido-confirmado/${id}`);
            }}
          />
        </div>

        <aside className="order-1 h-fit rounded-2xl bg-cream-alt p-5 lg:sticky lg:top-28 lg:order-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase text-ink">Tu pedido</h2>
            <Link href="/carrito" className="text-xs font-bold text-muted underline hover:text-ink">
              Editar
            </Link>
          </div>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={`${item.productId}-${item.size}-${item.color}`} className="flex items-center gap-3">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white">
                  {item.image && <SafeImage src={item.image} alt={item.title} fill sizes="56px" className="object-cover" />}
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
                    {item.quantity}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-ink">{item.title}</span>
                  <span className="block text-xs text-muted">
                    Talla {item.size}
                    {item.color && ` · ${item.color}`}
                  </span>
                </span>
                <span className="text-sm font-black text-ink">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm font-black text-ink">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
