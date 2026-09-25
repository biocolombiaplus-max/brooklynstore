'use client';

import ShoeStage from './brand/ShoeStage';
import StarTag from './brand/StarTag';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/lib/cart-store';
import { useSiteSettings } from '@/lib/settings-context';
import { classNames } from '@/lib/utils';
import { brandHref, brandTagline, isStarBrand } from '@/lib/brand';
import SafeImage from './SafeImage';
import MobileMenu from './MobileMenu';
import { CartIcon, ChevronIcon, CloseIcon, MenuIcon, SearchIcon } from './icons';

const MAIN_LINKS = [
  { href: '/catalogo?genero=hombre', label: 'Hombre' },
  { href: '/catalogo?genero=mujer', label: 'Mujer' },
  { href: '/catalogo?genero=ninos', label: 'Niños' },
];

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'marcas' | 'estilos' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const { storeName, logoUrl, logoHeight, brands: allBrands, collectionsMenu, featuredBrand } = useSiteSettings();
  const starOn = featuredBrand.enabled && !!featuredBrand.name;
  const brands = allBrands.filter((b) => !isStarBrand(featuredBrand, b));

  // Tarjeta premium de la marca estrella (menú de marcas en PC y celular).
  const starCard = starOn ? (
    <Link
      href={brandHref(featuredBrand.name)}
      className="group relative col-span-2 flex items-center gap-4 overflow-hidden rounded-2xl border border-primary/30 bg-[#070707] p-4 text-white transition-colors hover:border-primary"
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,rgba(184,146,58,0.28),transparent_65%)]" />
      <ShoeStage src={featuredBrand.image} alt={featuredBrand.name} sizes="120px" float={false} glow={false} className="h-16 w-28 shrink-0" />
      <span className="relative min-w-0 normal-case tracking-normal">
        <StarTag label={featuredBrand.badge} size="xs" />
        <span className="mt-1.5 block font-heading text-3xl font-black leading-none text-white">{featuredBrand.name}</span>
        <span className="mt-1 block font-display text-xs italic text-primary-light">{brandTagline(featuredBrand) || 'Ver modelos'} →</span>
      </span>
    </Link>
  ) : null;
  const totalItems = useCartStore((s) => s.totalItems());
  const openCart = useCartStore((s) => s.open);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : '/catalogo');
    setSearchOpen(false);
    setQuery('');
  }

  const logoBoxWidth = Math.round(logoHeight * 1.95);

  const logo = logoUrl ? (
    <span className="relative block" style={{ height: logoHeight, width: logoBoxWidth }}>
      <Image src={logoUrl} alt={storeName} fill priority sizes="200px" className="object-contain" />
    </span>
  ) : (
    <span className="whitespace-nowrap font-display text-2xl font-bold text-gold-gradient">{storeName}</span>
  );

  return (
    <header
      className={classNames(
        'sticky top-0 z-40 border-b bg-white/95 backdrop-blur transition-shadow',
        scrolled ? 'border-border shadow-soft' : 'border-transparent',
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-3 sm:h-20">
        {/* Móvil: menú a la izquierda */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-alt lg:hidden"
        >
          <MenuIcon />
        </button>

        <Link href="/" aria-label={`${storeName} — inicio`} className="flex shrink-0 items-center lg:mr-6">
          {logo}
        </Link>

        <nav ref={menuRef} className="hidden flex-1 items-center gap-0.5 whitespace-nowrap text-[13px] font-extrabold uppercase tracking-wider text-ink lg:flex xl:gap-1">
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative px-3 py-2 transition-colors hover:text-primary"
            >
              {link.label}
              <span className="absolute inset-x-3 -bottom-0.5 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          ))}

          {starOn && (
            <Link
              href={brandHref(featuredBrand.name)}
              className="group/on relative mx-1.5 flex items-center gap-2 overflow-hidden rounded-full border border-primary/60 bg-ink py-1.5 pl-2 pr-4 normal-case tracking-normal transition-all hover:border-primary hover:shadow-lift"
            >
              <span className="rounded-full bg-gold-gradient px-1.5 py-0.5 font-display text-[10px] italic text-ink">Nº1</span>
              <span className="font-heading text-[15px] font-black text-white transition-colors group-hover/on:text-primary-light">{featuredBrand.name}</span>
            </Link>
          )}

          <div className="relative">
            <button
              onClick={() => setOpenMenu((m) => (m === 'marcas' ? null : 'marcas'))}
              className="flex items-center gap-1 px-3 py-2 uppercase transition-colors hover:text-primary"
            >
              Marcas <ChevronIcon size={12} dir={openMenu === 'marcas' ? 'up' : 'down'} />
            </button>
            {openMenu === 'marcas' && (
              <div className="absolute left-0 top-full z-10 mt-3 grid w-[420px] animate-slideUp grid-cols-2 gap-1 rounded-2xl border border-border bg-white p-3 shadow-dark">
                {starCard && <div className="col-span-2 mb-2 grid grid-cols-2">{starCard}</div>}
                {brands.map((b) => (
                  <Link
                    key={b}
                    href={`/catalogo?marca=${encodeURIComponent(b)}`}
                    className="rounded-lg px-3 py-2.5 text-sm font-bold normal-case tracking-normal text-ink transition-colors hover:bg-cream-alt hover:text-primary"
                  >
                    {b}
                  </Link>
                ))}
                <Link
                  href="/catalogo"
                  className="col-span-2 mt-1 rounded-lg bg-ink px-3 py-2.5 text-center text-xs font-extrabold text-white transition-colors hover:bg-primary"
                >
                  Ver todas las marcas →
                </Link>
              </div>
            )}
          </div>

          {collectionsMenu.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setOpenMenu((m) => (m === 'estilos' ? null : 'estilos'))}
                className="flex items-center gap-1 px-3 py-2 uppercase transition-colors hover:text-primary"
              >
                Estilos <ChevronIcon size={12} dir={openMenu === 'estilos' ? 'up' : 'down'} />
              </button>
              {openMenu === 'estilos' && (
                <div className="absolute left-0 top-full z-10 mt-3 w-60 animate-slideUp rounded-2xl border border-border bg-white p-2 shadow-dark">
                  {collectionsMenu.map((c) => (
                    <Link
                      key={c.value}
                      href={`/catalogo?estilo=${encodeURIComponent(c.value)}`}
                      className="block rounded-lg px-3 py-2.5 text-sm font-bold normal-case tracking-normal text-ink transition-colors hover:bg-cream-alt hover:text-primary"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          <Link href="/catalogo?ofertas=1" className="px-3 py-2 text-urgent transition-colors hover:text-ink">
            Ofertas 🔥
          </Link>
          <Link href="/guia-de-tallas" className="hidden px-3 py-2 transition-colors hover:text-primary xl:block">
            Guía de tallas
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Buscar"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-alt"
          >
            <SearchIcon />
          </button>
          <button
            onClick={openCart}
            aria-label="Abrir carrito"
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-alt"
          >
            <CartIcon />
            {mounted && totalItems > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-5 min-w-[20px] animate-popIn items-center justify-center rounded-full bg-primary px-1 text-[11px] font-extrabold text-ink">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Buscador desplegable */}
      {searchOpen && (
        <div className="animate-slideUp border-t border-border bg-white">
          <form onSubmit={submitSearch} className="container-page flex items-center gap-3 py-3">
            <SearchIcon className="shrink-0 text-muted" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por marca o modelo: Nike, Samba, Air Force..."
              className="w-full bg-transparent py-2 text-base text-ink placeholder:text-muted focus:outline-none"
            />
            <button type="submit" className="btn-dark shrink-0 px-5 py-2.5 text-xs">
              Buscar
            </button>
          </form>
        </div>
      )}

      <MobileMenu open={mobileOpen} onClose={closeMobile} />
    </header>
  );
}
