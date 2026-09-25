'use client';

import StarTag from './brand/StarTag';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import SafeImage from './SafeImage';
import { useSiteSettings } from '@/lib/settings-context';
import { isStarBrand } from '@/lib/brand';
import { classNames } from '@/lib/utils';

export function discountPercentOf(product: Pick<Product, 'price' | 'compareAtPrice'>): number {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.compareAtPrice) * 100);
}

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { featuredBrand } = useSiteSettings();
  const star = isStarBrand(featuredBrand, product.brand);
  const discountPct = discountPercentOf(product);
  const secondImage = product.images[1];

  return (
    <Link href={`/producto/${product.slug}`} className="group block">
      <div
        className={classNames(
          'relative aspect-square overflow-hidden rounded-2xl bg-cream-alt',
          star && 'ring-1 ring-primary/70 transition-shadow group-hover:shadow-lift',
        )}
      >
        {product.images[0] ? (
          <>
            <SafeImage
              src={product.images[0]}
              alt={product.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-all duration-700 group-hover:scale-105"
            />
            {secondImage && (
              <SafeImage
                src={secondImage}
                alt=""
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-5xl">👟</div>
        )}

        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {discountPct > 0 && (
            <span className="rounded-full bg-urgent px-2.5 py-1 text-[11px] font-extrabold text-white shadow-soft">
              -{discountPct}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-primary-light">
              Nuevo
            </span>
          )}
        </div>

        {star && (
          <StarTag label={featuredBrand.badge} size="xs" className="absolute right-2.5 top-2.5" />
        )}

        {product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-extrabold uppercase text-urgent shadow-soft">
            🔥 Últimos {product.stock}
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-xs font-extrabold uppercase tracking-widest text-ink">
            Agotado
          </span>
        )}

        <span className="absolute inset-x-2.5 bottom-2.5 hidden translate-y-3 rounded-full bg-ink py-2.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 sm:block">
          Ver tallas y comprar →
        </span>
      </div>

      <div className="mt-3 px-0.5">
        {product.brand && (
          <p className={classNames('text-[10px] font-extrabold uppercase tracking-[0.18em]', star ? 'text-ink' : 'text-primary')}>
            {product.brand}
            {star && <span className="ml-1.5 font-display normal-case italic tracking-normal text-primary">· Nº1 en ventas</span>}
          </p>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-ink group-hover:underline">{product.title}</h3>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
          <span className={discountPct > 0 ? 'text-base font-black text-urgent' : 'text-base font-black text-ink'}>
            {formatPrice(product.price)}
          </span>
          {discountPct > 0 && (
            <span className="text-xs text-muted line-through">{formatPrice(product.compareAtPrice as number)}</span>
          )}
        </div>
        {!!product.reviewsCount && (
          <p className="mt-1 text-[11px] text-muted">
            <span className="text-primary">★★★★★</span> ({product.reviewsCount})
          </p>
        )}
      </div>
    </Link>
  );
}
