'use client';

import ExchangePolicy from '@/components/ExchangePolicy';
import StarTag from '@/components/brand/StarTag';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { getProductBySlug } from '@/lib/products';
import { formatPrice, resolveColorImage } from '@/lib/utils';
import { useSiteSettings } from '@/lib/settings-context';
import { GENDERS, type PaymentMethod, type Product } from '@/lib/types';
import ProductGallery from '@/components/product/ProductGallery';
import BuyBox from '@/components/product/BuyBox';
import SocialProofTicker from '@/components/product/SocialProofTicker';
import SizeGuide from '@/components/sizes/SizeGuide';
import Accordion, { AccordionItem } from '@/components/product/Accordion';
import ProductReviews from '@/components/product/ProductReviews';
import RelatedProducts from '@/components/product/RelatedProducts';
import HowItWorks from '@/components/HowItWorks';
import { discountPercentOf } from '@/components/ProductCard';
import { isStarBrand } from '@/lib/brand';

export default function ProductPage() {
  const params = useParams<{ slug: string }>();
  const { payments, shipping, featuredBrand } = useSiteSettings();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [colorImage, setColorImage] = useState<string | undefined>(undefined);
  const [ctaVisible, setCtaVisible] = useState(true);
  const ctaRef = useRef<HTMLDivElement>(null);
  const openBuyRef = useRef<((method: PaymentMethod) => void) | null>(null);

  // La barra fija de compra en celular solo aparece cuando los botones
  // reales del cuadro de compra no se ven, para no duplicarlos.
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting), {
      rootMargin: '0px 0px -10% 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    let cancelled = false;
    getProductBySlug(params.slug)
      .then((p) => {
        if (cancelled) return;
        setProduct(p);
        setColorImage(p?.colors[0] ? resolveColorImage(p, p.colors[0].name) : undefined);
        if (p) document.title = `${p.title} — Brooklyn Store`;
      })
      .catch(() => !cancelled && setProduct(null));
    return () => {
      cancelled = true;
    };
  }, [params.slug]);

  if (product === null) return notFound();

  if (product === undefined) {
    return (
      <div className="container-page grid gap-8 py-8 lg:grid-cols-2">
        <div className="skeleton aspect-square rounded-3xl" />
        <div className="space-y-4">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-9 w-3/4 rounded" />
          <div className="skeleton h-8 w-1/3 rounded" />
          <div className="skeleton h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  const genderLabel = GENDERS.find((g) => g.value === product.gender)?.label;

  return (
    <div>
      <div className="container-page pb-6 pt-4 sm:pt-8">
        <nav className="mb-4 hidden text-xs text-muted sm:block">
          <Link href="/" className="hover:text-primary">Inicio</Link> /{' '}
          <Link href="/catalogo" className="hover:text-primary">Catálogo</Link> /{' '}
          {product.brand && (
            <>
              <Link href={`/catalogo?marca=${encodeURIComponent(product.brand)}`} className="hover:text-primary">
                {product.brand}
              </Link>{' '}
              /{' '}
            </>
          )}
          <span className="text-ink">{product.title}</span>
        </nav>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          <ProductGallery
            images={product.images}
            title={product.title}
            discountPercent={discountPercentOf(product)}
            isNew={product.isNew}
            colorImage={colorImage}
          />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.brand && (
                <Link
                  href={`/catalogo?marca=${encodeURIComponent(product.brand)}`}
                  className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary hover:underline"
                >
                  {product.brand}
                </Link>
              )}
              {genderLabel && (
                <span className="rounded-full bg-cream-alt px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted">
                  {genderLabel}
                </span>
              )}
            </div>
            {isStarBrand(featuredBrand, product.brand) && (
              <Link
                href={`/catalogo?marca=${encodeURIComponent(product.brand)}`}
                className="relative mt-3 flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-primary/40 bg-[#070707] px-4 py-3 text-white"
              >
                <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_0%_50%,rgba(184,146,58,0.28),transparent_60%)]" />
                <span className="relative flex min-w-0 items-center gap-3">
                  <StarTag label={featuredBrand.badge} size="xs" />
                  <span className="truncate font-display text-sm italic text-primary-light">{featuredBrand.eyebrow}</span>
                </span>
                <span className="relative shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Ver colección →</span>
              </Link>
            )}
            <h1 className="mt-2 font-heading text-3xl font-black uppercase leading-tight text-ink sm:text-4xl">{product.title}</h1>
            {(!!product.reviewsCount || !!product.soldCount) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                {!!product.reviewsCount && (
                  <a href="#resenas" className="flex items-center gap-1 hover:underline">
                    <span className="text-primary">★★★★★</span> <span className="text-ink">{product.reviewsCount} reseñas</span>
                  </a>
                )}
                {!!product.soldCount && <span>· 🛍️ +{product.soldCount} vendidos</span>}
              </div>
            )}

            <div className="mt-4">
              <SocialProofTicker productTitle={product.title} />
            </div>

            <div id="comprar" className="mt-4 scroll-mt-24">
              <BuyBox
                product={product}
                onColorChange={(name) => setColorImage(resolveColorImage(product, name))}
                ctaRef={ctaRef}
                onRequestBuy={(open) => {
                  openBuyRef.current = open;
                }}
              />
            </div>

            <div className="mt-8">
              <Accordion>
                {product.description && (
                  <AccordionItem title="Detalles del producto" defaultOpen>
                    <p className="whitespace-pre-line">{product.description}</p>
                  </AccordionItem>
                )}
                <AccordionItem title="📏 Guía de tallas">
                  <SizeGuide fit={product.fit} availableSizes={product.sizes} />
                </AccordionItem>
                <AccordionItem title="🚚 Envíos y formas de pago">
                  <ul className="space-y-2">
                    <li>• Enviamos a todo el Ecuador con courier (Servientrega, Tramaco, Laar y más).</li>
                    <li>• Tiempo de entrega: {shipping.deliveryTime}.</li>
                    <li>
                      • <strong className="text-ink">Transferencia o depósito en Banco Pichincha:</strong> pagas el total y{' '}
                      {shipping.defaultRate === 0 ? 'el envío es GRATIS' : `el envío cuesta ${formatPrice(shipping.defaultRate)}`}.
                    </li>
                    {payments.codEnabled && (
                      <li>
                        • <strong className="text-ink">Contra entrega:</strong> adelantas {formatPrice(payments.codAdvance)} del envío y pagas
                        el resto en efectivo al recibir.
                      </li>
                    )}
                    <li>• Todos los pedidos se confirman por WhatsApp — te respondemos ya mismo.</li>
                  </ul>
                </AccordionItem>
                <AccordionItem title="🔄 Cambios y garantía">
                  <ExchangePolicy compact className="mb-4" />
                  <ul className="space-y-2">
                    <li>• Calidad garantizada: revisamos cada par antes de despacharlo.</li>
                    <li>• Si llega con algún defecto de fábrica, te lo cambiamos sin costo.</li>
                  </ul>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>

        <ProductReviews reviews={product.reviews ?? []} totalCount={product.reviewsCount} />
      </div>

      <HowItWorks />
      <RelatedProducts product={product} />

      {/* Barra fija de compra en celular */}
      {!ctaVisible && product.stock > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 animate-slideUp border-t border-border bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-dark backdrop-blur lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-muted">{product.title}</p>
              <p className="text-lg font-black text-ink">{formatPrice(product.price)}</p>
            </div>
            <button onClick={() => openBuyRef.current?.('transferencia')} className="btn-primary btn-shine flex-1 px-4 py-3.5 text-xs">
              Comprar ahora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
