'use client';

import { useSiteSettings } from '@/lib/settings-context';
import { formatPrice } from '@/lib/utils';

export default function HowItWorks() {
  const { payments } = useSiteSettings();
  const steps = [
    { icon: '👟', title: 'Elige tu par', text: 'Escoge el modelo, el color y tu talla. ¿Dudas? Usa la guía de tallas.' },
    { icon: '📝', title: 'Llena tus datos', text: 'Nombre, ciudad y dirección. Te toma menos de 1 minuto.' },
    { icon: '🏦', title: 'Paga y envía el comprobante', text: 'Te mostramos la cuenta Pichincha al instante. Pagas y nos mandas la foto por WhatsApp.' },
    {
      icon: '📦',
      title: 'Recibe y estrena',
      text: payments.codEnabled
        ? `Despachamos con Servientrega y te llega a casa. En contra entrega pagas el resto al recibir (hoy solo ${formatPrice(payments.codAdvance)}).`
        : 'Despachamos con Servientrega y recibes tus zapatos en la puerta de tu casa.',
    },
  ];

  return (
    <section id="como-comprar" className="scroll-mt-24 bg-cream-alt py-14 sm:py-20">
      <div className="container-page">
        <div className="text-center">
          <p className="section-eyebrow">Así de fácil</p>
          <h2 className="section-title mt-2">Cómo comprar en 4 pasos</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative rounded-2xl bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift sm:p-7"
            >
              <span className="absolute right-4 top-3 font-heading text-4xl font-black text-border transition-colors group-hover:text-primary-light sm:text-5xl">
                {i + 1}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-2xl">{step.icon}</span>
              <h3 className="mt-4 text-sm font-black uppercase text-ink sm:text-base">{step.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
