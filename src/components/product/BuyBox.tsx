'use client';

import { useState, type RefObject } from 'react';
import type { PaymentMethod, Product } from '@/lib/types';
import { classNames, formatPrice, resolveColorImage, whatsappLinkTo } from '@/lib/utils';
import { useCartStore } from '@/lib/cart-store';
import { useSiteSettings } from '@/lib/settings-context';
import { isKidSizes } from '@/lib/sizes';
import SafeImage from '../SafeImage';
import { CartIcon, RulerIcon, WhatsAppIcon } from '../icons';
import { discountPercentOf } from '../ProductCard';
import FitMeter from '../sizes/FitMeter';
import SizeGuideModal from '../sizes/SizeGuideModal';
import UrgencyTimer from './UrgencyTimer';
import QuickBuyModal from './QuickBuyModal';

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
  const kids = product.gender === 'ninos' || isKidSizes(product.sizes);
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
      image: resolveColorImage(product, color) || product.images[0] || '',
      size: size || 'Única',
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

  const waMessage = `¡Hola Brooklyn Store! 👋 Me interesa:\n• ${product.title}${size ? `\n• Talla: ${size}` : ''}${
    color ? `\n• Color: ${color}` : ''
  }\n\n¿Está disponible?`;

  const transferShipping = shipping.defaultRate;
  const lineTotal = product.price * quantity;

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
                    <SafeImage src={thumb} alt={c.name} fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className="absolute inset-1 rounded-full" style={{ backgroundColor: c.hex }} />
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
                  'h-12 rounded-xl border-2 text-sm font-extrabold transition-all duration-150 active:scale-95',
                  size === s
                    ? 'border-ink bg-ink text-white shadow-dark'
                    : sizeError
                      ? 'border-urgent/50 bg-white text-ink'
                      : 'border-border bg-white text-ink hover:border-ink',
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Tallas ecuatorianas. ¿Sabes tu talla en US o EU? <button type="button" onClick={() => setGuideOpen(true)} className="font-bold text-ink underline">Mira la equivalencia</button>
          </p>
        </div>
      )}

      {needsSize && <FitMeter fit={product.fit} />}

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
            href={whatsappLinkTo(whatsappNumber, `${waMessage}\n\n(Lo vi agotado en la web, ¿me avisan cuando llegue?)`, whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-dark w-full py-5"
          >
            Agotado — Avísame por WhatsApp cuando llegue
          </a>
        ) : (
          <>
            <button type="button" onClick={() => openBuy('transferencia')} className="btn-primary btn-shine w-full flex-col gap-0.5 py-4 normal-case tracking-normal">
              <span className="text-base font-black uppercase tracking-wider">🏦 Comprar con transferencia</span>
              <span className="text-xs font-bold opacity-80">
                Transferencia o depósito · {transferShipping === 0 ? 'Envío GRATIS' : `Envío ${formatPrice(transferShipping)}`} ·{' '}
                {formatPrice(lineTotal + transferShipping)}
              </span>
            </button>

            {payments.codEnabled && (
              <button
                type="button"
                onClick={() => openBuy('contra_entrega')}
                className="btn-dark w-full flex-col gap-0.5 py-4 normal-case tracking-normal"
              >
                <span className="text-base font-black uppercase tracking-wider">💵 Pago contra entrega</span>
                <span className="text-xs font-semibold text-primary-light">
                  Adelantas solo {formatPrice(payments.codAdvance)} del envío · El resto ({formatPrice(lineTotal)}) al recibir
                </span>
              </button>
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
              <strong className="text-ink">2.</strong> Adelantas {formatPrice(payments.codAdvance)} del envío por transferencia o depósito.
            </li>
            <li>
              <strong className="text-ink">3.</strong> Recibes tus zapatos en tu dirección y pagas el resto en efectivo. ¡Así de fácil!
            </li>
          </ol>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { icon: '✅', title: '100% originales' },
          { icon: '🚚', title: `Llega en ${shipping.deliveryTime.replace(' hábiles', '')}` },
          { icon: '🔄', title: 'Cambio de talla' },
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
        kids={kids}
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
