'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSiteSettings } from '@/lib/settings-context';
import { brandHref, brandTagline, isStarBrand } from '@/lib/brand';
import { formatPrice, whatsappLinkTo } from '@/lib/utils';
import { adviceMessage } from '@/lib/wa-messages';
import SafeImage from './SafeImage';
import ShoeStage from './brand/ShoeStage';
import StarTag from './brand/StarTag';
import { ChevronIcon, CloseIcon, SearchIcon, WhatsAppIcon } from './icons';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=70`;

const CATEGORIES = [
  { label: 'Hombre', href: '/catalogo?genero=hombre', image: img('photo-1491553895911-0055eca6402d') },
  { label: 'Mujer', href: '/catalogo?genero=mujer', image: img('photo-1543163521-1bf539c55dd2') },
  { label: 'Niños', href: '/catalogo?genero=ninos', image: img('photo-1514989940723-e8e51635b782') },
  { label: 'Ofertas', href: '/catalogo?ofertas=1', image: img('photo-1556906781-9a412961c28c'), hot: true },
];

// Menú de celular pensado para vender: buscador, marca estrella, categorías
// con foto, marcas, estilos, ayuda (tallas, pagos) y asesoría por WhatsApp.
// Se monta en <body> con un portal: dentro del encabezado (que tiene
// desenfoque de fondo) un elemento "fixed" queda atrapado y no se ve.
export default function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const { brands, collectionsMenu, featuredBrand, payments, shipping, whatsappNumber, whatsappCountryCode, storeName, logoUrl } =
    useSiteSettings();
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const starOn = featuredBrand.enabled && !!featuredBrand.name;
  const otherBrands = brands.filter((b) => !isStarBrand(featuredBrand, b));

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo');
    onClose();
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
      <div className="absolute inset-0 animate-[fadeIn_0.25s_ease-out] bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-[400px] animate-[slideInLeft_0.35s_cubic-bezier(0.22,1,0.36,1)] flex-col bg-white shadow-dark">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-border px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link href="/" onClick={onClose} className="relative block h-11 w-24">
            {logoUrl ? (
              <SafeImage src={logoUrl} alt={storeName} fill sizes="96px" className="object-contain object-left" />
            ) : (
              <span className="font-display text-xl font-bold text-gold-gradient">{storeName}</span>
            )}
          </Link>
          <button onClick={onClose} aria-label="Cerrar menú" className="flex h-11 w-11 items-center justify-center rounded-full bg-cream-alt">
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-4">
          {/* Buscador */}
          <form onSubmit={search} className="flex items-center gap-2 rounded-full border border-border bg-cream-alt/60 px-4 py-1">
            <SearchIcon size={18} className="shrink-0 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca marca o modelo..."
              className="w-full bg-transparent py-2.5 text-[15px] text-ink placeholder:text-muted focus:outline-none"
            />
          </form>

          {/* Marca estrella */}
          {starOn && (
            <Link
              href={brandHref(featuredBrand.name)}
              onClick={onClose}
              className="relative mt-5 flex items-center gap-3 overflow-hidden rounded-3xl border border-primary/40 bg-[#070707] p-4 text-white"
            >
              <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_50%,rgba(184,146,58,0.35),transparent_60%)]" />
              <span className="relative min-w-0 flex-1">
                <StarTag label={featuredBrand.badge} size="xs" />
                <span className="mt-2 block font-heading text-4xl font-black leading-none">{featuredBrand.name}</span>
                <span className="mt-1 block font-display text-sm italic text-gold-gradient">{brandTagline(featuredBrand)}</span>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-gold-gradient px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-ink">
                  Comprar ahora →
                </span>
              </span>
              {featuredBrand.image && (
                <ShoeStage src={featuredBrand.image} alt={featuredBrand.name} sizes="160px" glow={false} className="relative h-24 w-36 shrink-0" />
              )}
            </Link>
          )}

          {/* Categorías con foto */}
          <p className="mt-7 text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted">Comprar por categoría</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {CATEGORIES.map((c) => (
              <Link key={c.label} href={c.href} onClick={onClose} className="group relative h-24 overflow-hidden rounded-2xl bg-ink">
                <SafeImage src={c.image} alt={c.label} fill sizes="180px" className="object-cover opacity-75 transition-transform duration-500 group-active:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute bottom-2.5 left-3 flex items-center gap-1 text-base font-black uppercase text-white">
                  {c.label} {c.hot && '🔥'}
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/catalogo"
            onClick={onClose}
            className="mt-2.5 flex items-center justify-between rounded-2xl bg-ink px-4 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white"
          >
            Ver todo el catálogo <ChevronIcon dir="right" />
          </Link>

          {/* Marcas */}
          <p className="mt-7 text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted">Marcas</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {otherBrands.map((b) => (
              <Link
                key={b}
                href={brandHref(b)}
                onClick={onClose}
                className="flex h-12 items-center justify-center rounded-xl border border-border px-1.5 text-center text-[12px] font-extrabold leading-tight text-ink active:border-ink active:bg-ink active:text-white"
              >
                {b}
              </Link>
            ))}
            <Link
              href="/catalogo"
              onClick={onClose}
              className="flex h-12 items-center justify-center rounded-xl bg-ink px-1.5 text-center text-[12px] font-extrabold leading-tight text-primary-light"
            >
              Y más →
            </Link>
          </div>

          {/* Estilos */}
          {collectionsMenu.length > 0 && (
            <>
              <p className="mt-7 text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted">Estilos</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {collectionsMenu.map((c) => (
                  <Link
                    key={c.value}
                    href={`/catalogo?estilo=${encodeURIComponent(c.value)}`}
                    onClick={onClose}
                    className="rounded-full bg-cream-alt px-4 py-2 text-sm font-bold text-ink"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Ayuda para comprar */}
          <p className="mt-7 text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted">Compra sin dudas</p>
          <div className="mt-3 divide-y divide-border rounded-2xl border border-border">
            {[
              { href: '/guia-de-tallas', icon: '📏', title: 'Guía de tallas', sub: 'Calcula tu talla en 1 minuto' },
              {
                href: '/#formas-de-pago',
                icon: '💵',
                title: 'Pago contra entrega',
                sub: `Adelantas ${formatPrice(payments.codAdvance)} y el resto al recibir`,
              },
              { href: '/#como-comprar', icon: '🛍️', title: 'Cómo comprar', sub: 'En 4 pasos, confirmas por WhatsApp' },
              { href: '/#preguntas', icon: '❓', title: 'Preguntas frecuentes', sub: `Envíos en ${shipping.deliveryTime}` },
            ].map((item) => (
              <Link key={item.title} href={item.href} onClick={onClose} className="flex items-center gap-3 px-4 py-3.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-50 text-lg ring-1 ring-primary/30">
                  {item.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-ink">{item.title}</span>
                  <span className="block truncate text-xs text-muted">{item.sub}</span>
                </span>
                <ChevronIcon dir="right" className="text-muted" />
              </Link>
            ))}
          </div>
        </nav>

        {/* Asesoría por WhatsApp siempre visible */}
        <div className="border-t border-border bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          <a
            href={whatsappLinkTo(whatsappNumber, adviceMessage(), whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp w-full py-3.5"
          >
            <WhatsAppIcon /> Asesoría gratis por WhatsApp
          </a>
          <p className="mt-2 text-center text-[11px] font-semibold text-muted">🛡️ Compra segura · 🚚 Envío a todo Ecuador</p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
