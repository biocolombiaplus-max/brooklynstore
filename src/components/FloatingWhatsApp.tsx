'use client';

import { usePathname } from 'next/navigation';
import { useSiteSettings } from '@/lib/settings-context';
import { whatsappLinkTo } from '@/lib/utils';
import { WhatsAppIcon } from './icons';

export default function FloatingWhatsApp() {
  const { whatsappCountryCode, whatsappNumber, storeName } = useSiteSettings();
  const pathname = usePathname();
  // En la ficha de producto el celular tiene la barra fija de compra abajo,
  // así que el botón sube para no taparla.
  const onProduct = pathname?.startsWith('/producto/');
  if (pathname?.startsWith('/checkout')) return null;

  return (
    <a
      href={whatsappLinkTo(whatsappNumber, `¡Hola ${storeName}! 👋 Quiero información`, whatsappCountryCode)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className={`group fixed right-4 z-30 flex items-center gap-2 sm:right-6 ${onProduct ? 'bottom-24 lg:bottom-6' : 'bottom-5 sm:bottom-6'}`}
    >
      <span className="hidden rounded-full bg-white px-4 py-2 text-xs font-extrabold text-ink shadow-dark transition-all group-hover:translate-x-0 sm:block sm:translate-x-2 sm:opacity-0 sm:group-hover:opacity-100">
        ¿Te ayudamos? 👋
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-white shadow-[0_10px_30px_rgba(37,211,102,0.45)] transition-transform group-hover:scale-110">
        <span className="absolute inset-0 animate-ping rounded-full bg-whatsapp/40" />
        <WhatsAppIcon size={30} className="relative" />
      </span>
    </a>
  );
}
