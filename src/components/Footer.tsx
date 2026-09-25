'use client';

import { generalMessage } from '@/lib/wa-messages';
import Image from 'next/image';
import Link from 'next/link';
import { useSiteSettings } from '@/lib/settings-context';
import { formatPrice, whatsappLinkTo } from '@/lib/utils';
import PaymentBadges from '@/components/PaymentBadges';
import { WhatsAppIcon } from './icons';

const SOCIALS: { key: 'instagram' | 'facebook' | 'tiktok'; label: string }[] = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'tiktok', label: 'TikTok' },
];

export default function Footer() {
  const { storeName, logoUrl, whatsappCountryCode, whatsappNumber, footer, brands, payments, shipping } = useSiteSettings();
  const socialLinks = SOCIALS.filter((s) => footer[s.key]);

  return (
    <footer className="bg-ink text-white">
      <div className="border-b border-white/10">
        <div className="container-page grid gap-6 py-8 text-center sm:grid-cols-3 sm:text-left">
          {[
            { icon: '🚚', title: 'Envío a todo Ecuador', text: shipping.deliveryTime },
            { icon: '💵', title: 'Contra entrega', text: `Adelantas solo ${formatPrice(payments.codAdvance)}` },
            { icon: '🛡️', title: 'Compra segura', text: 'Garantía Brooklyn' },
          ].map((item) => (
            <div key={item.title} className="flex items-center justify-center gap-3 sm:justify-start">
              <span className="text-2xl">{item.icon}</span>
              <span>
                <span className="block text-sm font-extrabold uppercase">{item.title}</span>
                <span className="block text-xs text-white/60">{item.text}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          {logoUrl ? (
            <span className="relative block h-16 w-32">
              <Image src={logoUrl} alt={storeName} fill sizes="128px" className="object-contain object-left" />
            </span>
          ) : (
            <p className="font-display text-2xl font-bold text-gold-gradient">{storeName}</p>
          )}
          <p className="mt-4 text-sm leading-relaxed text-white/65">{footer.brandText}</p>
          {socialLinks.length > 0 && (
            <div className="mt-5 flex gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.key}
                  href={footer[s.key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-4 py-2 text-xs font-bold transition-colors hover:border-primary hover:text-primary-light"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-primary-light">Comprar</h4>
          <ul className="space-y-2.5 text-sm text-white/75">
            <li><Link href="/catalogo?genero=hombre" className="hover:text-white">Hombre</Link></li>
            <li><Link href="/catalogo?genero=mujer" className="hover:text-white">Mujer</Link></li>
            <li><Link href="/catalogo?genero=ninos" className="hover:text-white">Niños</Link></li>
            <li><Link href="/catalogo?ofertas=1" className="hover:text-white">Ofertas</Link></li>
            <li><Link href="/catalogo" className="hover:text-white">Todo el catálogo</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-primary-light">Ayuda</h4>
          <ul className="space-y-2.5 text-sm text-white/75">
            <li><Link href="/guia-de-tallas" className="hover:text-white">📏 Guía de tallas</Link></li>
            <li><Link href="/#como-comprar" className="hover:text-white">🛍️ Cómo comprar</Link></li>
            <li><Link href="/#formas-de-pago" className="hover:text-white">💳 Formas de pago</Link></li>
            <li><Link href="/#preguntas" className="hover:text-white">❓ Preguntas frecuentes</Link></li>
          </ul>
          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/40">Marcas</p>
          <p className="mt-2 text-xs leading-relaxed text-white/60">{brands.join(' · ')} · y más</p>
        </div>

        <div>
          <h4 className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-primary-light">Contacto</h4>
          <p className="mb-5 text-sm text-white/75">{footer.contactText}</p>
          <a
            href={whatsappLinkTo(whatsappNumber, generalMessage(), whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp"
          >
            <WhatsAppIcon /> Escríbenos
          </a>
          <p className="mt-5 text-xs text-white/50">
            📱{' '}
            <a href={`tel:+${whatsappCountryCode}${whatsappNumber.replace(/\D/g, '').replace(/^0+/, '')}`} className="text-white/80 hover:text-primary-light">
              +{whatsappCountryCode} {whatsappNumber.replace(/\D/g, '').replace(/^0+/, '').replace(/^(\d{2})(\d{3})(\d{4})$/, '$1 $2 $3')}
            </a>
          </p>
          {footer.email && (
            <p className="mt-1.5 text-xs text-white/50">
              ✉️{' '}
              <a href={`mailto:${footer.email}`} className="break-all text-white/80 hover:text-primary-light">
                {footer.email}
              </a>
            </p>
          )}
          {footer.address && <p className="mt-1.5 text-xs text-white/50">📍 {footer.address}</p>}
          <div className="mt-6">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/40">Formas de pago</p>
            <PaymentBadges dark />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 text-center text-xs text-white/40">
        <p>{footer.copyrightText || `© ${new Date().getFullYear()} ${storeName} · Ecuador. Todos los derechos reservados.`}</p>
        <Link href="/admin/login" className="mt-2 inline-block text-white/25 transition-colors hover:text-white/60">
          Iniciar sesión
        </Link>
      </div>
    </footer>
  );
}
