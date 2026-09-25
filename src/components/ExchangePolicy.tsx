'use client';

import { useSiteSettings } from '@/lib/settings-context';
import { classNames, whatsappLinkTo } from '@/lib/utils';
import { exchangeMessage } from '@/lib/wa-messages';
import { WhatsAppIcon } from './icons';

// Política de cambio de talla: plazo destacado, pasos claros y botón que
// abre WhatsApp con la solicitud lista para completar.
export default function ExchangePolicy({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { exchangeWindowHours: hours, whatsappNumber, whatsappCountryCode } = useSiteSettings();

  const steps = [
    { title: `Avísanos en máximo ${hours} h`, text: 'Escríbenos por WhatsApp desde que recibes tu pedido.' },
    { title: 'Envíanos fotos', text: 'Zapato sin uso, con su caja y etiquetas.' },
    { title: 'Recibe tu nueva talla', text: 'Coordinamos el retiro y te despachamos el cambio.' },
  ];

  return (
    <div className={classNames('overflow-hidden rounded-2xl border border-primary/30 bg-white', className)}>
      <div className="flex items-center justify-between gap-3 bg-ink px-5 py-4 text-white">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary-light">¿No te quedó?</p>
          <p className="mt-0.5 text-base font-black uppercase">Cambio de talla</p>
        </div>
        <div className="shrink-0 rounded-xl border border-primary/60 px-3 py-1.5 text-center">
          <p className="font-display text-2xl leading-none text-gold-gradient">{hours} h</p>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">Plazo máximo</p>
        </div>
      </div>

      <div className="p-5">
        <ol className={classNames('grid gap-4', !compact && 'sm:grid-cols-3')}>
          {steps.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-xs font-black text-ink">
                {i + 1}
              </span>
              <span>
                <span className="block text-sm font-extrabold text-ink">{step.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>

        <p className="mt-4 rounded-xl bg-cream-alt px-4 py-3 text-xs leading-relaxed text-muted">
          ⏱️ El plazo de <strong className="text-ink">{hours} horas</strong> cuenta desde que recibes tu pedido. Pasado ese tiempo no
          podemos procesar el cambio.
        </p>

        <a
          href={whatsappLinkTo(whatsappNumber, exchangeMessage(hours), whatsappCountryCode)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp mt-4 w-full py-3.5 text-xs"
        >
          <WhatsAppIcon size={18} /> Solicitar cambio por WhatsApp
        </a>
      </div>
    </div>
  );
}
