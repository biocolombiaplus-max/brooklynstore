'use client';

import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import { useSiteSettings } from '@/lib/settings-context';
import { buildCartWhatsAppMessage, whatsappLinkTo } from '@/lib/utils';
import { GENDERS } from '@/lib/types';
import {
  brandMessage,
  catalogMessage,
  filteredCatalogMessage,
  generalMessage,
  sizeHelpMessage,
  useWaContext,
} from '@/lib/wa-messages';
import { WhatsAppIcon } from './icons';

// El mensaje cambia según la página: el modelo que está viendo, los filtros
// del catálogo, su carrito, ayuda con la talla... así la tienda responde
// directo sin tener que preguntar "¿en qué te ayudo?".
function messageForCurrentPage(pathname: string, productMessage: string | null, cart: Parameters<typeof buildCartWhatsAppMessage>[0]): string {
  if (pathname.startsWith('/producto/') && productMessage) return productMessage;
  if (pathname.startsWith('/carrito') && cart.length) return buildCartWhatsAppMessage(cart);
  if (pathname.startsWith('/guia-de-tallas')) return sizeHelpMessage();
  if (pathname.startsWith('/pedido-confirmado')) return generalMessage('Tengo una consulta sobre mi pedido 📦');
  if (pathname.startsWith('/catalogo')) {
    const params = new URLSearchParams(window.location.search);
    const brand = params.get('marca');
    if (brand && [...params.keys()].length === 1) return brandMessage(brand);
    const filters = [
      GENDERS.find((g) => g.value === params.get('genero'))?.label,
      brand,
      params.get('estilo'),
      params.get('talla') && `talla ${params.get('talla')}`,
      params.get('ofertas') === '1' && 'ofertas',
      params.get('q') && `“${params.get('q')}”`,
    ].filter(Boolean) as string[];
    return filters.length ? filteredCatalogMessage(filters) : catalogMessage();
  }
  return generalMessage();
}

export default function FloatingWhatsApp() {
  const { whatsappCountryCode, whatsappNumber } = useSiteSettings();
  const pathname = usePathname() ?? '/';
  const productMessage = useWaContext((s) => s.message);
  const cart = useCartStore((s) => s.items);
  // En la ficha de producto el celular tiene la barra fija de compra abajo,
  // así que el botón sube para no taparla.
  const onProduct = pathname.startsWith('/producto/');
  if (pathname.startsWith('/checkout')) return null;

  return (
    <a
      href={whatsappLinkTo(whatsappNumber, generalMessage(), whatsappCountryCode)}
      onClick={(e) => {
        e.currentTarget.href = whatsappLinkTo(whatsappNumber, messageForCurrentPage(pathname, productMessage, cart), whatsappCountryCode);
      }}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={`group fixed right-4 z-30 flex items-center gap-2 sm:right-6 ${onProduct ? 'bottom-24 lg:bottom-6' : 'bottom-[max(1.25rem,env(safe-area-inset-bottom))] sm:bottom-6'}`}
    >
      <span className="hidden rounded-full bg-white px-4 py-2 text-xs font-extrabold text-ink shadow-dark transition-all group-hover:translate-x-0 sm:block sm:translate-x-2 sm:opacity-0 sm:group-hover:opacity-100">
        ¿Te ayudamos? 👋
      </span>
      <span className="relative flex h-12 w-12 items-center sm:h-14 sm:w-14 justify-center rounded-full bg-whatsapp text-white shadow-[0_10px_30px_rgba(37,211,102,0.45)] transition-transform group-hover:scale-110">
        <span className="absolute inset-0 animate-ping rounded-full bg-whatsapp/40" />
        <WhatsAppIcon size={26} className="relative sm:h-[30px] sm:w-[30px]" />
      </span>
    </a>
  );
}
