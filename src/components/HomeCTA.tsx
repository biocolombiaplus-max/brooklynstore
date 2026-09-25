'use client';

import Link from 'next/link';
import { useSiteSettings } from '@/lib/settings-context';
import { whatsappLinkTo } from '@/lib/utils';
import { WhatsAppIcon } from './icons';

export default function HomeCTA() {
  const { cta, storeName, whatsappNumber, whatsappCountryCode } = useSiteSettings();

  return (
    <section className="relative overflow-hidden bg-ink py-16 text-center text-white sm:py-24">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="container-page relative max-w-3xl">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-primary-light">{cta.eyebrow}</p>
        <h2 className="mt-3 font-heading text-4xl font-black uppercase leading-tight sm:text-6xl">
          <span className="text-gold-gradient">{cta.heading}</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm text-white/75 sm:text-base">{cta.text}</p>
        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={cta.buttonUrl} className="btn-primary btn-shine text-base">
            {cta.buttonText} →
          </Link>
          <a
            href={whatsappLinkTo(whatsappNumber, `¡Hola ${storeName}! 👋 Quiero asesoría para elegir mis zapatos`, whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp text-base"
          >
            <WhatsAppIcon /> Asesoría por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
