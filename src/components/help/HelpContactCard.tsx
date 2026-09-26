'use client';

import { useSiteSettings } from '@/lib/settings-context';
import { whatsappLinkTo } from '@/lib/utils';
import { generalMessage } from '@/lib/wa-messages';
import { WhatsAppIcon } from '../icons';

// Cierre de cada página de ayuda: si algo no quedó claro, un toque a WhatsApp.
export default function HelpContactCard() {
  const { whatsappNumber, whatsappCountryCode, footer } = useSiteSettings();
  return (
    <div className="relative mt-10 overflow-hidden rounded-3xl bg-[#0a0a0a] p-6 text-white ring-1 ring-primary/40 sm:p-8">
      <span className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.3),transparent_70%)]" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary-light">¿Necesitas ayuda?</p>
          <p className="mt-1 text-xl font-black uppercase">Te respondemos ya mismo</p>
          <p className="mt-1 text-sm text-white/65">
            Escríbenos por WhatsApp{footer.email ? ` o a ${footer.email}` : ''}. Personas reales, no robots. 🙌
          </p>
        </div>
        <a
          href={whatsappLinkTo(whatsappNumber, generalMessage(), whatsappCountryCode)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp btn-shine shrink-0"
        >
          <WhatsAppIcon /> Escribir por WhatsApp
        </a>
      </div>
    </div>
  );
}
