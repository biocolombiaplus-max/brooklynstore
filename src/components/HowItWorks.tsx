'use client';

import { useSiteSettings } from '@/lib/settings-context';
import { formatPrice } from '@/lib/utils';

export default function HowItWorks() {
  const { payments } = useSiteSettings();
  const steps = [
    { icon: '👟', title: 'Elige tu par', text: 'Escoge el modelo, el color y tu talla. ¿Dudas? Usa la guía de tallas.' },
    { icon: '📝', title: 'Llena tus datos', text: 'Nombre, ciudad y dirección. Te toma menos de 1 minuto.' },
    { icon: '💬', title: 'Confirma por WhatsApp', text: 'Tu pedido llega a nuestro WhatsApp y te respondemos ya mismo.' },
    {
      icon: '📦',
      title: 'Paga y estrena',
      text: payments.codEnabled
        ? `Transfiere el total, o solo ${formatPrice(payments.codAdvance)} de envío y el resto al recibir.`
        : 'Transfiere o deposita, y recibe tus zapatos en la puerta de tu casa.',
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
