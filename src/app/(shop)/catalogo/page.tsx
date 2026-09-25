'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getActiveProducts } from '@/lib/products';
import { GENDERS, type Product } from '@/lib/types';
import { useSiteSettings } from '@/lib/settings-context';
import { classNames } from '@/lib/utils';
import ProductGrid, { ProductGridSkeleton } from '@/components/ProductGrid';
import { discountPercentOf } from '@/components/ProductCard';
import { CloseIcon } from '@/components/icons';
import SafeImage from '@/components/SafeImage';
import { brandTagline, isStarBrand } from '@/lib/brand';
import ShoeStage from '@/components/brand/ShoeStage';
import StarSeal from '@/components/brand/StarSeal';

type SortOption = 'relevancia' | 'vendidos' | 'nuevo' | 'precio_asc' | 'precio_desc' | 'descuento';

const SORT_LABELS: Record<SortOption, string> = {
  relevancia: 'Destacados',
  vendidos: 'Más vendidos',
  nuevo: 'Lo más nuevo',
  precio_asc: 'Precio: menor a mayor',
  precio_desc: 'Precio: mayor a menor',
  descuento: 'Mayor descuento',
};

const PRICE_RANGES = [
  { value: '0-60', label: 'Hasta $60' },
  { value: '60-100', label: '$60 a $100' },
  { value: '100-140', label: '$100 a $140' },
  { value: '140-9999', label: 'Más de $140' },
];

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function sortProducts(products: Product[], sort: SortOption): Product[] {
  const sorted = [...products];
  switch (sort) {
    case 'precio_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'precio_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'vendidos':
      return sorted.sort((a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0));
    case 'nuevo':
      return sorted.sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || (b.createdAt ?? 0) - (a.createdAt ?? 0));
    case 'descuento':
      return sorted.sort((a, b) => discountPercentOf(b) - discountPercentOf(a));
    default:
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || (b.soldCount ?? 0) - (a.soldCount ?? 0));
  }
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'rounded-full border px-4 py-2 text-xs font-bold transition-all',
        active ? 'border-ink bg-ink text-white' : 'border-border bg-white text-ink hover:border-ink',
      )}
    >
      {children}
    </button>
  );
}

function CatalogoContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { collectionsMenu, featuredBrand } = useSiteSettings();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Los filtros viven en la URL: así los enlaces del menú ("Hombre",
  // "Nike", "Ofertas"...) llegan ya filtrados y se pueden compartir.
  const gender = searchParams.get('genero') ?? '';
  const brand = searchParams.get('marca') ?? '';
  const style = searchParams.get('estilo') ?? searchParams.get('collection') ?? '';
  const size = searchParams.get('talla') ?? '';
  const price = searchParams.get('precio') ?? '';
  const onlyOffers = searchParams.get('ofertas') === '1';
  const q = searchParams.get('q') ?? '';
  const sort = (searchParams.get('orden') as SortOption) || 'relevancia';

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key === 'estilo') params.delete('collection');
    router.replace(`${pathname}${params.toString() ? `?${params}` : ''}`, { scroll: false });
  }

  function toggleParam(key: string, value: string) {
    setParam(key, searchParams.get(key) === value ? null : value);
  }

  useEffect(() => {
    let cancelled = false;
    getActiveProducts()
      .then((list) => !cancelled && setProducts(list))
      .catch(() => !cancelled && setProducts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = filtersOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [filtersOpen]);

  const brands = useMemo(
    () =>
      Array.from(new Set((products ?? []).map((p) => p.brand).filter(Boolean))).sort(
        (a, b) => Number(isStarBrand(featuredBrand, b)) - Number(isStarBrand(featuredBrand, a)) || a.localeCompare(b),
      ),
    [products, featuredBrand],
  );
  const starView = !!brand && isStarBrand(featuredBrand, brand);
  const styles = useMemo(() => {
    const present = new Set((products ?? []).map((p) => p.collection));
    const fromMenu = collectionsMenu.filter((c) => present.has(c.value));
    const extra = Array.from(present)
      .filter((v) => v && !fromMenu.some((c) => c.value === v))
      .map((v) => ({ label: v.charAt(0).toUpperCase() + v.slice(1), value: v }));
    return [...fromMenu, ...extra];
  }, [products, collectionsMenu]);
  const sizes = useMemo(
    () => Array.from(new Set((products ?? []).flatMap((p) => p.sizes))).sort((a, b) => Number(a) - Number(b)),
    [products],
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    let list = products;
    if (gender) list = list.filter((p) => p.gender === gender || (gender !== 'ninos' && p.gender === 'unisex'));
    if (brand) list = list.filter((p) => p.brand.toLowerCase() === brand.toLowerCase());
    if (style) list = list.filter((p) => p.collection === style);
    if (size) list = list.filter((p) => p.sizes.includes(size));
    if (onlyOffers) list = list.filter((p) => discountPercentOf(p) > 0);
    if (price) {
      const [min, max] = price.split('-').map(Number);
      list = list.filter((p) => p.price >= min && p.price <= max);
    }
    if (q) {
      const needle = normalize(q);
      list = list.filter((p) => normalize(`${p.brand} ${p.title} ${p.collection}`).includes(needle));
    }
    return sortProducts(list, sort);
  }, [products, gender, brand, style, size, onlyOffers, price, q, sort]);

  const activeCount = [gender, brand, style, size, price, onlyOffers ? '1' : '', q].filter(Boolean).length;
  const genderLabel = GENDERS.find((g) => g.value === gender)?.label;
  const title = q
    ? `Resultados para “${q}”`
    : onlyOffers
      ? 'Ofertas 🔥'
      : brand || (genderLabel ? `Zapatos ${genderLabel.toLowerCase() === 'niños' ? 'para niños' : `de ${genderLabel.toLowerCase()}`}` : 'Todo el catálogo');

  const filtersPanel = (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">Para</p>
        <div className="flex flex-wrap gap-2">
          {GENDERS.filter((g) => g.value !== 'unisex').map((g) => (
            <FilterChip key={g.value} active={gender === g.value} onClick={() => toggleParam('genero', g.value)}>
              {g.label}
            </FilterChip>
          ))}
        </div>
      </div>
      {brands.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">Marca</p>
          <div className="flex flex-wrap gap-2">
            {brands.map((b) =>
              isStarBrand(featuredBrand, b) ? (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleParam('marca', b)}
                  className={classNames(
                    'flex items-center gap-1.5 rounded-full border py-1.5 pl-1.5 pr-4 text-xs font-extrabold transition-all',
                    brand.toLowerCase() === b.toLowerCase()
                      ? 'border-primary bg-ink text-white shadow-lift'
                      : 'border-primary/60 bg-ink text-white hover:border-primary',
                  )}
                >
                  <span className="rounded-full bg-gold-gradient px-1.5 py-0.5 font-display text-[10px] italic text-ink">Nº1</span>
                  {b}
                </button>
              ) : (
                <FilterChip key={b} active={brand.toLowerCase() === b.toLowerCase()} onClick={() => toggleParam('marca', b)}>
                  {b}
                </FilterChip>
              ),
            )}
          </div>
        </div>
      )}
      {styles.length > 0 && (
        <div>
          <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">Estilo</p>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <FilterChip key={s.value} active={style === s.value} onClick={() => toggleParam('estilo', s.value)}>
                {s.label}
              </FilterChip>
            ))}
          </div>
        </div>
      )}
      {sizes.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">Talla (EC)</p>
            <Link href="/guia-de-tallas" className="text-[11px] font-bold text-ink underline">
              ¿Mi talla?
            </Link>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleParam('talla', s)}
                className={classNames(
                  'h-10 rounded-lg border text-xs font-extrabold transition-all',
                  size === s ? 'border-ink bg-ink text-white' : 'border-border bg-white text-ink hover:border-ink',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-muted">Precio</p>
        <div className="flex flex-wrap gap-2">
          {PRICE_RANGES.map((r) => (
            <FilterChip key={r.value} active={price === r.value} onClick={() => toggleParam('precio', r.value)}>
              {r.label}
            </FilterChip>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-urgent/5 px-4 py-3">
        <span className="text-sm font-extrabold text-urgent">🔥 Solo ofertas</span>
        <input type="checkbox" checked={onlyOffers} onChange={() => setParam('ofertas', onlyOffers ? null : '1')} className="h-5 w-5 accent-[#E2472D]" />
      </label>
      {activeCount > 0 && (
        <button type="button" onClick={() => router.replace(pathname, { scroll: false })} className="w-full text-sm font-bold text-muted underline hover:text-ink">
          Limpiar todos los filtros
        </button>
      )}
    </div>
  );

  return (
    <div>
      {starView ? (
        <div className="relative isolate overflow-hidden bg-[#070707] text-white">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_78%_50%,rgba(184,146,58,0.25),transparent_60%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <div className="container-page grid items-center gap-4 py-10 sm:grid-cols-[1fr_380px] sm:py-14">
            <div className="order-2 sm:order-1">
              <nav className="mb-4 text-xs text-white/45">
                <Link href="/" className="hover:text-primary-light">Inicio</Link> / <Link href="/catalogo" className="hover:text-primary-light">Catálogo</Link> /{' '}
                <span className="text-white">{featuredBrand.name}</span>
              </nav>
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.35em] text-primary-light">
                <span className="h-px w-10 bg-gold-gradient" />
                {featuredBrand.eyebrow}
              </p>
              <h1 className="mt-4">
                <span className="block font-heading text-7xl font-black leading-[0.85] tracking-tight sm:text-8xl">{featuredBrand.name}</span>
                <span className="mt-2 block font-display text-2xl italic text-gold-gradient sm:text-4xl">{brandTagline(featuredBrand)}</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60">{featuredBrand.text}</p>
            </div>
            <div className="relative order-1 sm:order-2">
              {featuredBrand.image && (
                <ShoeStage src={featuredBrand.image} alt={featuredBrand.name} sizes="380px" className="mx-auto aspect-[16/11] w-full max-w-sm" />
              )}
              <StarSeal label={featuredBrand.badge} className="absolute -top-2 right-0 w-20 text-[13px] sm:w-24 sm:text-[15px]" />
            </div>
          </div>
        </div>
      ) : (
      <div className="border-b border-border bg-cream-alt/60">
        <div className="container-page py-8 sm:py-10">
          <nav className="mb-3 text-xs text-muted">
            <Link href="/" className="hover:text-primary">Inicio</Link> / <span className="text-ink">Catálogo</span>
          </nav>
          <h1 className="section-title">{title}</h1>
          <p className="mt-2 text-sm text-muted">Envío a todo el Ecuador · Paga por transferencia o contra entrega</p>
        </div>
      </div>
      )}

      <div className="container-page py-8">
        <div className="sticky top-16 z-20 -mx-4 mb-6 flex items-center justify-between gap-3 border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:top-20 lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="flex items-center gap-2 rounded-full border-2 border-ink px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-ink lg:hidden"
          >
            Filtrar {activeCount > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px]">{activeCount}</span>}
          </button>
          <p className="hidden text-sm text-muted lg:block">
            {products ? `${filtered.length} ${filtered.length === 1 ? 'modelo' : 'modelos'}` : 'Cargando...'}
          </p>
          <select
            value={sort}
            onChange={(e) => setParam('orden', e.target.value === 'relevancia' ? null : e.target.value)}
            className="rounded-full border border-border bg-white px-4 py-2.5 text-xs font-bold text-ink focus:border-ink focus:outline-none"
            aria-label="Ordenar por"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-28">{filtersPanel}</div>
          </aside>

          <div>
            <p className="mb-4 text-xs text-muted lg:hidden">{products ? `${filtered.length} modelos` : ''}</p>
            {products === null ? (
              <ProductGridSkeleton count={8} />
            ) : filtered.length === 0 ? (
              <div className="rounded-3xl bg-cream-alt py-16 text-center">
                <p className="text-5xl">🔍</p>
                <p className="mt-4 text-lg font-black uppercase text-ink">No encontramos modelos con esos filtros</p>
                <p className="mt-1 text-sm text-muted">Prueba quitando algún filtro o pregúntanos por WhatsApp, capaz lo tenemos.</p>
                <button type="button" onClick={() => router.replace(pathname)} className="btn-dark mt-6">
                  Ver todo el catálogo
                </button>
              </div>
            ) : (
              <ProductGrid products={filtered} />
            )}
          </div>
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setFiltersOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] animate-slideUp flex-col rounded-t-3xl bg-white">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="text-lg font-black uppercase text-ink">Filtrar</p>
              <button onClick={() => setFiltersOpen(false)} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-alt">
                <CloseIcon />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filtersPanel}</div>
            <div className="border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <button onClick={() => setFiltersOpen(false)} className="btn-dark w-full">
                Ver {filtered.length} {filtered.length === 1 ? 'modelo' : 'modelos'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CatalogoPage() {
  return (
    <Suspense fallback={<div className="container-page py-10 text-center text-muted">Cargando catálogo...</div>}>
      <CatalogoContent />
    </Suspense>
  );
}
