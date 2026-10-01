'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/lib/settings-context';
import { classNames } from '@/lib/utils';
import SafeImage from '../SafeImage';

// Tarjetas "Compra por categoría" del inicio. Todo (fotos, textos, botones
// y enlaces) se edita en Admin → Configuración → Inicio — Categorías.
export default function CategoryTiles() {
  const { categoryTiles } = useSiteSettings();
  const tiles = categoryTiles.tiles.filter((t) => t.label.trim());
  if (!categoryTiles.enabled || tiles.length === 0) return null;

  return (
    <section className="bg-white pt-14 sm:pt-20">
      <div className="container-page">
        {categoryTiles.eyebrow && <p className="section-eyebrow">{categoryTiles.eyebrow}</p>}
        {categoryTiles.heading && <h2 className="section-title mt-2">{categoryTiles.heading}</h2>}

        <div
          className={classNames(
            'mt-8 grid grid-cols-2 gap-3 sm:gap-5',
            tiles.length === 3 ? 'lg:grid-cols-3' : tiles.length >= 5 ? 'lg:grid-cols-4 xl:grid-cols-5' : 'lg:grid-cols-4',
          )}
        >
          {tiles.map((tile, i) => (
            <Link
              key={`${tile.label}-${i}`}
              href={tile.href || '/catalogo'}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-ink sm:aspect-[4/5]"
            >
              <SafeImage
                src={tile.image}
                alt={tile.label}
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <h3 className="font-heading text-xl font-black uppercase text-white sm:text-3xl">{tile.label}</h3>
                {tile.sub && <p className="mt-1 hidden text-xs text-white/80 sm:block">{tile.sub}</p>}
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-ink transition-colors group-hover:bg-primary sm:text-xs">
                  {tile.buttonText || 'Comprar'} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
