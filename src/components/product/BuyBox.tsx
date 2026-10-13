'use client';

import ColorSwatch, { swatchBackground } from '../ColorSwatch';
import { usSizeFor } from '@/lib/sizes';
import { useEffect, useState, type RefObject } from 'react';
import { trackPixel } from '@/lib/pixel';
import { metaItemId } from '@/lib/metaCatalog';
import { trackVisitorProduct } from '@/lib/visitor';
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
import LabelScanner from '../sizes/LabelScanner';
import DeliveryEstimate from './DeliveryEstimate';
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
  // Acción que quedó esperando la talla (se abre la hoja "Elige tu talla").
  const [pending, setPending] = useState<{ type: 'buy'; method: PaymentMethod } | { type: 'cart' } | null>(null);

  const discountPercent = discountPercentOf(product);
  const soldOut = product.stock <= 0;
  const needsSize = product.sizes.length > 0;

  function handleColorChange(colorName: string) {
    setColor(colorName);
    onColorChange?.(colorName);
  }

  // Si llega desde un anuncio de un color (?color=Negro), se abre en ese color.
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('color');
    const match = wanted && product.colors.find((c) => c.name.toLowerCase() === wanted.toLowerCase());
    if (match) {
      setColor(match.name);
      onColorChange?.(match.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Píxel: la persona vio este zapato (con el ID del catálogo de Meta).
  useEffect(() => {
    const fromLink = new URLSearchParams(window.location.search).get('color');
    const viewed = product.colors.find((c) => c.name.toLowerCase() === fromLink?.toLowerCase())?.name ?? color;
    trackVisitorProduct(product);
    trackPixel('ViewContent', {
      content_ids: [metaItemId(product, viewed)],
      content_name: product.title,
      content_category: product.brand,
      content_type: 'product',
      value: product.price,
      currency: 'USD',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  function buildItem(sizeOverride?: string) {
    const chosen = sizeOverride ?? size;
    return {
      productId: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      price: product.price,
      ...(product.codPrice ? { codPrice: product.codPrice } : {}),
      image: resolveColorImage(product, color) || product.images[0] || '',
      size: chosen || 'Única',
      ...(usSizeFor(chosen, product.gender) ? { sizeUs: usSizeFor(chosen, product.gender) } : {}),
      color,
      quantity,
      metaId: metaItemId(product, color),
    };
  }

  // Sin talla elegida se abre la hoja "Elige tu talla" y, al tocar una, la
  // compra sigue sola (antes solo se bajaba la página hasta el selector y
  // muchos creían que el botón no funcionaba).
  function ensureSize(action: { type: 'buy'; method: PaymentMethod } | { type: 'cart' }, sizeOverride?: string): boolean {
    if (!needsSize || sizeOverride || size) return true;
    setSizeError(true);
    setPending(action);
    return false;
  }

  function openBuy(method: PaymentMethod, sizeOverride?: string) {
    if (!ensureSize({ type: 'buy', method }, sizeOverride)) return;
    setBuyMethod(method);
    trackPixel('InitiateCheckout', {
      content_ids: [metaItemId(product, color)],
      content_type: 'product',
      value: product.price * quantity,
      currency: 'USD',
      num_items: quantity,
    });
  }

  // La barra fija del celular usa esta misma función para abrir la compra.
  onRequestBuy?.((method) => openBuy(method));

  function pickFromSheet(s: string) {
    const action = pending;
    setSize(s);
    setSizeError(false);
    setPending(null);
    trackPixel('CustomizeProduct', { content_ids: [metaItemId(product, color)], content_name: `${product.title} talla ${s}` });
    if (action?.type === 'buy') openBuy(action.method, s);
    else if (action?.type === 'cart') handleAddToCart(s);
  }

  function handleAddToCart(sizeOverride?: string) {
    if (!ensureSize({ type: 'cart' }, sizeOverride)) return;
    addItem(buildItem(sizeOverride));
    trackPixel('AddToCart', {
      content_ids: [metaItemId(product, color)],
      content_name: product.title,
      content_type: 'product',
      value: product.price * quantity,
      currency: 'USD',
    });
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
  // El envío se muestra desde el inicio: nada de sorpresas al pagar.
  const shippingFee = settings.shipping.defaultRate;
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
        <p className="mt-1.5 text-[13px] font-semibold text-ink">
          + {formatPrice(shippingFee)} de envío a todo Ecuador
          <span className="font-normal text-muted"> · IVA incluido</span>
        </p>
      </div>

      <DeliveryEstimate />

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
                      <ColorSwatch hex={c.hex} hex2={c.hex2} hex3={c.hex3} pattern={c.pattern} logoPattern={c.logoPattern} image={c.image} className="absolute bottom-1 right-1 h-4 w-4 ring-2 ring-white" />
                    </>
                  ) : (
                    <span className="absolute inset-1 rounded-full" style={{ background: swatchBackground(c.hex, c.hex2, c.hex3, { pattern: c.pattern, image: c.image, logoPattern: c.logoPattern }) }} />
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
            <p className={classNames('flex items-center gap-2 text-sm font-black', sizeError ? 'text-urgent' : 'text-ink')}>
              <StepNumber n={1} done={!!size} />
              {size ? (
                <>
                  Talla elegida: <span className="text-primary">EC {size}</span>
                  {usSizeFor(size, product.gender) && <span className="text-muted"> · US {usSizeFor(size, product.gender)}</span>}
                </>
              ) : sizeError ? (
                '👇 Elige tu talla para continuar'
              ) : (
                'Toca tu talla (EC)'
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
                  trackPixel('CustomizeProduct', { content_ids: [metaItemId(product, color)], content_name: `${product.title} talla ${s}` });
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
            Número grande: talla Ecuador{product.gender === 'hombre' ? ' (igual a la europea, EUR)' : ''} · debajo: talla US
            {product.gender === 'mujer' ? ' mujer' : product.gender === 'hombre' ? ' hombre' : ''}.{' '}
            <button type="button" onClick={() => setGuideOpen(true)} className="font-bold text-ink underline">
              Ver tabla con centímetros
            </button>
          </p>
          <div className="mt-3">
            <LabelScanner
              compact
              gender={product.gender}
              availableSizes={product.sizes}
              productTitle={product.title}
              onPickSize={(s) => {
                setSize(s);
                setSizeError(false);
              }}
            />
          </div>
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
            <StepTitle n={needsSize ? 2 : 1} text="Elige cómo quieres pagar y toca el botón naranja" />

            {payments.codEnabled && (
              <PayOption
                recommended
                icon="💵"
                title="Pago contra entrega"
                lines={[`Pagas tus zapatos (${formatPrice(cod.payOnDelivery)}) en efectivo al recibirlos`, `Solo ${formatPrice(cod.payNow)} del envío para despachar`]}
                cta="Pedir contra entrega"
                onClick={() => openBuy('contra_entrega')}
              />
            )}

            <PayOption
              icon="⚡"
              title="Pagar de inmediato"
              lines={[`${formatPrice(lineTotal)} + ${formatPrice(shippingFee)} de envío por transferencia o depósito`, 'El precio más bajo · despacho el mismo día']}
              cta={`Pedir ahora · ${formatPrice(lineTotal + shippingFee)}`}
              onClick={() => openBuy('transferencia')}
            />

            <p className="pt-1 text-center text-[11px] text-muted">
              Al tocar el botón confirmas tu pedido por WhatsApp con un asesor. <strong className="text-ink">No pagas nada en la página.</strong>
            </p>

            <button
              type="button"
              onClick={() => handleAddToCart()}
              className="flex w-full items-center justify-center gap-2 py-1 text-xs font-bold text-muted underline underline-offset-4 hover:text-ink"
            >
              <CartIcon size={15} />
              {added ? '✓ ¡Agregado al carrito!' : 'O agrégalo al carrito y sigue viendo'}
            </button>
          </>
        )}

        <a
          href={whatsappLinkTo(whatsappNumber, waMessage, whatsappCountryCode)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackPixel('Contact', { content_name: product.title })}
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
        gender={product.gender}
        availableSizes={product.sizes}
        productTitle={product.title}
        onPickSize={(s) => {
          if (pending) {
            setGuideOpen(false);
            pickFromSheet(s);
            return;
          }
          setSize(s);
          setSizeError(false);
        }}
      />

      {pending && !guideOpen && (
        <SizeSheet
          product={product}
          color={color}
          image={resolveColorImage(product, color) || product.images[0]}
          waHelpUrl={whatsappLinkTo(
            whatsappNumber,
            productMessage({ title: product.title, slug: product.slug, brand: product.brand, price: product.price, color }, 'No sé mi talla, ¿me ayudan? 🙏'),
            whatsappCountryCode,
          )}
          onPick={pickFromSheet}
          onGuide={() => setGuideOpen(true)}
          onClose={() => setPending(null)}
        />
      )}

      {buyMethod && <QuickBuyModal items={[buildItem()]} initialMethod={buyMethod} onClose={() => setBuyMethod(null)} />}
    </div>
  );
}

// Hoja que sube desde abajo para elegir la talla sin buscarla en la página:
// al tocar una talla la compra continúa sola.
function SizeSheet({
  product,
  color,
  image,
  waHelpUrl,
  onPick,
  onGuide,
  onClose,
}: {
  product: Product;
  color: string;
  image?: string;
  waHelpUrl: string;
  onPick: (size: string) => void;
  onGuide: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg animate-slideUp rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 shadow-dark sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Elige tu talla"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border sm:hidden" />
        <div className="flex items-center gap-3">
          <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-cream-alt">
            {image && <SafeImage src={image} alt={product.title} fill sizes="64px" className="object-cover" />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-black uppercase text-ink">{product.title}</span>
            <span className="block text-xs text-muted">
              {color && `${color} · `}
              {formatPrice(product.price)}
            </span>
          </span>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-alt text-lg font-bold text-ink">
            ×
          </button>
        </div>

        <p className="mt-5 text-base font-black text-ink">👇 Toca tu talla para continuar</p>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onPick(s)}
              className="flex h-16 flex-col items-center justify-center rounded-2xl border-2 border-border bg-white leading-none text-ink transition-all active:scale-95 active:border-ink active:bg-ink active:text-white"
            >
              <span className="text-lg font-black">{s}</span>
              {usSizeFor(s, product.gender) && <span className="mt-1 text-[10px] font-bold text-muted">US {usSizeFor(s, product.gender)}</span>}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
          <button type="button" onClick={onGuide} className="flex items-center gap-1.5 text-ink underline decoration-primary decoration-2 underline-offset-4">
            <RulerIcon size={15} /> ¿Cuál es mi talla?
          </button>
          <a href={waHelpUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[#128C4B]">
            <WhatsAppIcon size={15} /> Te ayudamos por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function StepNumber({ n, done = false }: { n: number; done?: boolean }) {
  return (
    <span
      className={classNames(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black',
        done ? 'bg-whatsapp text-white' : 'bg-ink text-white',
      )}
    >
      {done ? '✓' : n}
    </span>
  );
}

function StepTitle({ n, text }: { n: number; text: string }) {
  return (
    <p className="flex items-center gap-2 text-sm font-black text-ink">
      <StepNumber n={n} />
      {text} 👇
    </p>
  );
}

// Opción de pago: arriba qué incluye, abajo un botón naranja que no deja
// dudas de dónde tocar.
function PayOption({
  icon,
  title,
  lines,
  cta,
  onClick,
  recommended = false,
}: {
  icon: string;
  title: string;
  lines: string[];
  cta: string;
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <div
      className={classNames(
        'relative overflow-hidden rounded-2xl border-2 bg-white',
        recommended ? 'border-buy shadow-[0_12px_30px_rgba(255,106,0,0.18)]' : 'border-border',
      )}
    >
      {recommended && (
        <span className="absolute right-3 top-3 rounded-full bg-buy/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-buy-dark">
          El más pedido
        </span>
      )}
      <button type="button" onClick={onClick} className="block w-full px-4 pb-3 pt-4 text-left">
        <span className="block pr-24 text-[15px] font-black uppercase tracking-wide text-ink">
          {icon} {title}
        </span>
        {lines.map((line) => (
          <span key={line} className="mt-1 block text-xs leading-snug text-muted">
            {line}
          </span>
        ))}
      </button>
      <div className="px-3 pb-3">
        <button type="button" onClick={onClick} className={classNames('btn-buy btn-shine w-full', recommended && 'btn-buy-pulse')}>
          👉 {cta}
          <span aria-hidden className="text-lg leading-none">→</span>
        </button>
      </div>
    </div>
  );
}
