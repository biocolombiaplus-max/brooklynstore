import Link from 'next/link';
import SafeImage from '../SafeImage';

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=75`;

const TILES = [
  { label: 'Hombre', sub: 'Urbanos, running y deportivos', href: '/catalogo?genero=hombre', image: img('photo-1491553895911-0055eca6402d') },
  { label: 'Mujer', sub: 'Estilo y comodidad todo el día', href: '/catalogo?genero=mujer', image: img('photo-1543163521-1bf539c55dd2') },
  { label: 'Running', sub: 'Para correr y entrenar', href: '/catalogo?estilo=running', image: img('photo-1542291026-7eec264c27ff') },
  { label: 'Ofertas', sub: 'Precios que no se repiten', href: '/catalogo?ofertas=1', image: img('photo-1556906781-9a412961c28c') },
];

export default function CategoryTiles() {
  return (
    <section className="bg-white pt-14 sm:pt-20">
      <div className="container-page">
        <p className="section-eyebrow">Compra por categoría</p>
        <h2 className="section-title mt-2">¿Qué andas buscando?</h2>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {TILES.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
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
                <p className="mt-1 hidden text-xs text-white/80 sm:block">{tile.sub}</p>
                <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-ink transition-colors group-hover:bg-primary sm:text-xs">
                  Comprar →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
