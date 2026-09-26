'use client';

import ColorSwatch, { swatchBackground } from '../ColorSwatch';
import { usSizeFor } from '@/lib/sizes';
import { useEffect, useState, type RefObject } from 'react';
import { productMessage, useWaContext } from '@/lib/wa-messages';
import type { PaymentMethod, Product } from '@/lib/types';
import { classNames, formatPrice, resolveColorImage, whatsappLinkTo } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { computeOrderTotals } from '@/lib/shipping';
import { useSiteSettings } from '@/lib/settings-context';
import SafeImage from '../SafeImage';
import { CartIcon, RulerIcon, WhatsAppIcon } from '../icons';
import { discountPercentOf } from '../ProductCard';
import SizeGuideModal from '../sizes/SizeGuideModal';
import UrgencyTimer from './UrgencyTimer';
import QuickBuyModal from './QuickBuyModal';
import PaymentLogos, { CourierLogo } from '@/components/brand/PaymentLogos';

export default function BuyBox({
  product,
  onColorChange,
  ctaRef,
  onRequestBuy,
}: {
  product: Product;
  onColorChange?: (colorName: string) => void;
  ctaRef?: RefObject<HTMLDivElement>;
  onRequestBuy?: (open: (method: PaymentMethod) => void) => void;
}) {
  const settings = useSiteSettings();
  const { whatsappCountryCode, whatsappNumber, payments, shipping } = settings;
  const addItem = useCartStore((s) => s.addItem);
  const [size, setSize] = useState('');
  const [color, setColor] = useState(product.colors[0]?.name ?? '');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [buyMethod, setBuyMethod] = useState<PaymentMethod | null>(null);

  const discountPercent = discountPercentOf(product);
  const soldOut = product.stock <= 0;
  const needsSize = product.sizes.length > 0;

  function handleColorChange(colorName: string) {
    setColor(colorName);
    onColorChange?.(colorName);
  }

  function buildItem() {
    return {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      price: product.price,
      ...(product.codPrice ? { codPrice: product.codPrice } : {}),
      image: resolveColorImage(product, color) || product.images[0] || '',
      size: size || 'Única',
      ...(usSizeFor(size, product.gender) ? { sizeUs: usSizeFor(size, product.gender) } : {}),
      color,
      quantity,
    };
  }

  // Sin talla elegida no se deja avanzar: se marca el selector en rojo y se
  // lleva la pantalla hasta él — es el error #1 en compras de zapatos.
  function ensureSize(): boolean {
    if (!needsSize || size) return true;
    setSizeError(true);
    document.getElementById('selector-talla')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return false;
  }

  function openBuy(method: PaymentMethod) {
    if (!ensureSize()) return;
    setBuyMethod(method);
  }

  // La barra fija del celular usa esta misma función para abrir la compra.
  onRequestBuy?.(openBuy);

  function handleAddToCart() {
    if (!ensureSize()) return;
    addItem(buildItem());
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  }

  const waMessage = productMessage({ title: product.title, slug: product.slug, brand: product.brand, price: product.price, size: size && usSizeFor(size, product.gender) ? `${size} EC (US ${usSizeFor(size, product.gender)})` : size, color });
  const setWaContext = useWaContext((s) => s.setMessage);

  // El botón flotante de WhatsApp también manda este modelo con la talla y
  // el color que el cliente tenga elegidos.
  useEffect(() => {
    setWaContext(productMessage({ title: product.title, slug: product.slug, brand: product.brand, price: product.price, size: size && usSizeFor(size, product.gender) ? `${size} EC (US ${usSizeFor(size, product.gender)})` : size, color }));
  }, [product, size, color, setWaContext]);
  useEffect(() => () => setWaContext(null), [setWaContext]);

  const lineTotal = product.price * quantity;
  const cod = computeOrderTotals(settings, [{ price: product.price, codPrice: product.codPrice ?? undefined, quantity }], 'contra_entrega', '');

  return (
    <div className="space-y-6">
      {/* Precio */}
      <div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className={classNames('text-3xl font-black sm:text-4xl', discountPercent > 0 ? 'text-urgent' : 'text-ink')}>
            {formatPrice(product.price)}
          </span>
          {discountPercent > 0 && (
            <>
              <span className="text-lg text-muted line-through">{formatPrice(product.compareAtPrice as number)}</span>
              <span className="rounded-full bg-urgent/10 px-2.5 py-1 text-xs font-extrabold text-urgent">
                Ahorras {formatPrice((product.compareAtPrice as number) - product.price)}
              </span>
            </>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">IVA incluido · Precio en dólares</p>
      </div>

      <UrgencyTimer />

      {product.stock > 0 && product.stock <= 10 && (
        <div>
          <p className="mb-1.5 text-xs font-bold text-urgent">🔥 ¡Pilas! Solo quedan {product.stock} pares disponibles</p>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-urgent" style={{ width: `${Math.max(8, product.stock * 10)}%` }} />
          </div>
        </div>
      )}

      {/* Color */}
      {product.colors.length > 0 && (
        <div>
          <p className="mb-2.5 text-sm font-bold text-ink">
            Color: <span className="font-normal text-muted">{color}</span>
          </p>
          <div className="flex flex-wrap gap-2.5">
            {product.colors.map((c) => {
              const thumb = c.image;
              const selected = color === c.name;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => handleColorChange(c.name)}
                  aria-label={c.name}
                  title={c.name}
                  className={classNames(
                    'relative overflow-hidden rounded-xl border-2 transition-all',
                    thumb ? 'h-16 w-16' : 'h-11 w-11 rounded-full',
                    selected ? 'border-ink ring-2 ring-primary/40 ring-offset-2' : 'border-border hover:border-ink/50',
                  )}
                >
                  {thumb ? (
                    <>
                      <SafeImage src={thumb} alt={c.name} fill sizes="64px" className="object-cover" />
                      <ColorSwatch hex={c.hex} hex2={c.hex2} className="absolute bottom-1 right-1 h-4 w-4 ring-2 ring-white" />
                    </>
                  ) : (
                    <span className="absolute inset-1 rounded-full" style={{ background: swatchBackground(c.hex, c.hex2) }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Talla */}
      {needsSize && (
        <div id="selector-talla" className="scroll-mt-32">
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p className={classNames('text-sm font-bold', sizeError ? 'text-urgent' : 'text-ink')}>
              {size ? (
                <>
                  Talla elegida: <span className="text-primary">EC {size}</span>
                  {usSizeFor(size, product.gender) && <span className="text-muted"> · US {usSizeFor(size, product.gender)}</span>}
                </>
              ) : sizeError ? (
                '👇 Elige tu talla para continuar'
              ) : (
                'Elige tu talla (EC)'
              )}
            </p>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="flex items-center gap-1.5 text-xs font-extrabold text-ink underline decoration-primary decoration-2 underline-offset-4 hover:text-primary"
            >
              <RulerIcon size={16} /> ¿Cuál es mi talla?
            </button>
          </div>
          <div className={classNames('grid grid-cols-4 gap-2 rounded-2xl sm:grid-cols-5', sizeError && 'animate-attention')}>
            {product.sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s);
                  setSizeError(false);
                }}
                className={classNames(
                  'flex h-14 flex-col items-center justify-center rounded-xl border-2 leading-none transition-all duration-150 active:scale-95',
                  size === s
                    ? 'border-ink bg-ink text-white shadow-dark'
                    : sizeError
                      ? 'border-urgent/50 bg-white text-ink'
                      : 'border-border bg-white text-ink hover:border-ink',
                )}
              >
                <span className="text-[15px] font-extrabold">{s}</span>
                {usSizeFor(s, product.gender) && (
                  <span className={classNames('mt-1 text-[10px] font-bold', size === s ? 'text-primary-light' : 'text-muted')}>
                    US {usSizeFor(s, product.gender)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Número grande: talla Ecuador · debajo: talla US {product.gender === 'mujer' ? 'mujer' : 'hombre'}. ¿Necesitas la EU? <button type="button" onClick={() => setGuideOpen(true)} className="font-bold text-ink underline">Mira la equivalencia</button>
          </p>
        </div>
      )}

      {/* Cantidad */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink">Cantidad</p>
        <div className="flex items-center rounded-full border-2 border-border">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-11 w-11 text-lg font-bold" aria-label="Menos">
            −
          </button>
          <span className="w-8 text-center font-black">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(Math.max(1, product.stock || 10), q + 1))}
            className="h-11 w-11 text-lg font-bold"
            aria-label="Más"
          >
            +
          </button>
        </div>
      </div>

      {/* Botones de pago — todos terminan confirmando por WhatsApp */}
      <div ref={ctaRef} className="space-y-3">
        {soldOut ? (
          <a
            href={whatsappLinkTo(whatsappNumber, productMessage({ title: product.title, slug: product.slug, brand: product.brand, price: product.price, size: size && usSizeFor(size, product.gender) ? `${size} EC (US ${usSizeFor(size, product.gender)})` : size, color }, 'Lo vi agotado en la web. ¿Me avisan cuando llegue? 🙏'), whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark w-full py-5"
          >
            Agotado — Avísame por WhatsApp cuando llegue
          </a>
        ) : (
          <>
            <button
              type="button"
              onClick={() => openBuy('transferencia')}
              className="btn-primary btn-shine w-full justify-between gap-3 rounded-2xl px-5 py-4 text-left normal-case tracking-normal"
            >
              <span className="flex flex-col gap-1">
                <span className="text-[15px] font-black uppercase tracking-wide sm:text-base">🏦 Pago por transferencia</span>
                <span className="text-[12px] font-bold opacity-80">
                  Depósito o transferencia Banco Pichincha
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-2xl font-black leading-none">{formatPrice(lineTotal)}</span>
                <span className="mt-1 block text-[10px] font-extrabold uppercase opacity-70">{quantity > 1 ? `${quantity} pares` : 'Precio'}</span>
              </span>
            </button>

            {payments.codEnabled && (
              <div className="overflow-hidden rounded-2xl bg-ink shadow-dark ring-1 ring-primary/40">
                <button
                  type="button"
                  onClick={() => openBuy('contra_entrega')}
                  className="btn-base w-full justify-between gap-3 rounded-none px-5 py-4 text-left normal-case tracking-normal text-white"
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-[15px] font-black uppercase tracking-wide sm:text-base">💵 Pago contra entrega</span>
                    <span className="text-[12px] font-semibold text-white/70">
                      Hoy {formatPrice(cod.payNow)} de envío · {formatPrice(cod.payOnDelivery)} al recibir
                    </span>
                  </span>
                  <span className="shrink-0 rounded-xl bg-gold-gradient px-3 py-2 text-center text-ink">
                    <span className="block text-[9px] font-extrabold uppercase">Hoy solo</span>
                    <span className="block text-xl font-black leading-none">{formatPrice(cod.payNow)}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => openBuy('contra_entrega')}
                  className="grid w-full grid-cols-3 border-t border-white/10 text-center text-white"
                >
                  {[
                    { n: '1', t: `Hoy ${formatPrice(cod.payNow)}`, s: 'garantiza tu envío' },
                    { n: '2', t: 'Te llega', s: 'a tu dirección' },
                    { n: '3', t: `Pagas ${formatPrice(cod.payOnDelivery)}`, s: 'en efectivo al recibir' },
                  ].map((step, i) => (
                    <span key={step.n} className={classNames('px-1.5 py-2.5', i > 0 && 'border-l border-white/10')}>
                      <span className="block text-[12px] font-extrabold text-primary-light">
                        {step.n}. {step.t}
                      </span>
                      <span className="block text-[10px] text-white/60">{step.s}</span>
                    </span>
                  ))}
                </button>
              </div>
            )}

            <button type="button" onClick={handleAddToCart} className="btn-secondary w-full">
              <CartIcon size={18} />
              {added ? '✓ ¡Agregado al carrito!' : 'Agregar al carrito'}
            </button>
          </>
        )}

        <a
          href={whatsappLinkTo(whatsappNumber, waMessage, whatsappCountryCode)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-full py-2 text-sm font-bold text-ink transition-colors hover:text-whatsapp"
        >
          <WhatsAppIcon className="text-whatsapp" /> ¿Dudas? Pregúntanos por WhatsApp
        </a>

        <div className="flex flex-col items-center gap-2 border-t border-border pt-3">
          <p className="flex items-center gap-2 text-[11px] font-bold text-muted">
            Envío seguro con <CourierLogo size="sm" />
          </p>
          <PaymentLogos size="sm" className="justify-center" />
        </div>
      </div>

      {/* Mini explicación del pago contra entrega — genera confianza */}
      {payments.codEnabled && !soldOut && (
        <div className="rounded-2xl bg-gold-50 p-4 ring-1 ring-primary/30">
          <p className="text-sm font-black text-ink">💵 ¿Cómo funciona el pago contra entrega?</p>
          <ol className="mt-2 space-y-1 text-xs leading-relaxed text-muted">
            <li>
              <strong className="text-ink">1.</strong> Confirmas tu pedido por WhatsApp.
            </li>
            <li>
              <strong className="text-ink">2.</strong> Adelantas solo {formatPrice(cod.payNow)} por transferencia o depósito en Banco Pichincha para garantizar tu envío.
            </li>
            <li>
              <strong className="text-ink">3.</strong> Recibes tus zapatos en tu dirección y pagas {formatPrice(cod.payOnDelivery)} en efectivo al recibir. ¡Así de fácil!
            </li>
          </ol>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: '🛡️', title: 'Compra segura' },
          { icon: '🚚', title: `Llega en ${shipping.deliveryTime.replace(' hábiles', '')}` },
          { icon: '🔄', title: 'Cambio en 48 h' },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border border-border px-2 py-3">
            <span className="text-lg">{item.icon}</span>
            <p className="mt-1 text-[10px] font-extrabold uppercase leading-tight text-ink">{item.title}</p>
          </div>
        ))}
      </div>

      <SizeGuideModal
        open={guideOpen}
        onClose={() => setGuideOpen(false)}
        fit={product.fit}
        availableSizes={product.sizes}
        productTitle={product.title}
        onPickSize={(s) => {
          setSize(s);
          setSizeError(false);
        }}
      />

      {buyMethod && <QuickBuyModal items={[buildItem()]} initialMethod={buyMethod} onClose={() => setBuyMethod(null)} />}
    </div>
  );
}
