'use client';

import { useSiteSettings } from '@/lib/settings-context';
import type { CourierSettings, PaymentLogo } from '@/lib/types';
import { classNames } from '@/lib/utils';

type Size = 'sm' | 'md';

const FRAME: Record<Size, string> = {
  sm: 'h-7 min-w-[46px] px-2 rounded-md',
  md: 'h-9 min-w-[58px] px-2.5 rounded-lg',
};

// Diseños incluidos para los medios de pago más usados en Ecuador. Desde el
// panel se puede subir el logo oficial de cada uno y reemplaza este diseño.
function BuiltInLogo({ id, name, size }: { id: string; name: string; size: Size }) {
  const txt = size === 'sm' ? 'text-[10px]' : 'text-[12px]';
  switch (id) {
    case 'visa':
      return <span className={classNames('font-black italic tracking-tight text-[#1A1F71]', size === 'sm' ? 'text-[13px]' : 'text-[16px]')}>VISA</span>;
    case 'mastercard':
      return (
        <svg viewBox="0 0 40 24" className={size === 'sm' ? 'h-4' : 'h-5'} aria-hidden>
          <circle cx="14" cy="12" r="10" fill="#EB001B" />
          <circle cx="26" cy="12" r="10" fill="#F79E1B" />
          <path d="M20 4a10 10 0 0 1 0 16 10 10 0 0 1 0-16z" fill="#FF5F00" />
        </svg>
      );
    case 'diners':
      return <span className={classNames('font-extrabold text-[#0079BE]', txt)}>Diners Club</span>;
    case 'pichincha':
      return (
        <span className={classNames('flex items-center gap-1 font-black leading-none text-[#0F265C]', txt)}>
          <span className="inline-block h-3 w-3 rounded-sm bg-[#FFDD00] ring-1 ring-[#0F265C]/20" />
          Pichincha
        </span>
      );
    case 'deuna':
      return <span className={classNames('font-black lowercase text-[#5E2B97]', size === 'sm' ? 'text-[12px]' : 'text-[14px]')}>deuna!</span>;
    case 'guayaquil':
      return <span className={classNames('font-extrabold text-[#D6006E]', txt)}>Guayaquil</span>;
    case 'pacifico':
      return <span className={classNames('font-extrabold text-[#0067B1]', txt)}>Pacífico</span>;
    case 'produbanco':
      return <span className={classNames('font-extrabold text-[#00843D]', txt)}>Produbanco</span>;
    case 'bolivariano':
      return <span className={classNames('font-extrabold text-[#00306E]', txt)}>Bolivariano</span>;
    default:
      return <span className={classNames('font-extrabold text-ink', txt)}>{name}</span>;
  }
}

export function PaymentLogoChip({ logo, size = 'md' }: { logo: PaymentLogo; size?: Size }) {
  return (
    <span
      title={logo.name}
      className={classNames('inline-flex shrink-0 items-center justify-center bg-white shadow-sm ring-1 ring-black/10', FRAME[size])}
    >
      {logo.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo.imageUrl} alt={logo.name} className={classNames('w-auto object-contain', size === 'sm' ? 'h-4 max-w-[64px]' : 'h-5 max-w-[80px]')} />
      ) : (
        <BuiltInLogo id={logo.id} name={logo.name} size={size} />
      )}
    </span>
  );
}

// Fila de logos de medios de pago activos (se eligen en el panel).
export default function PaymentLogos({ size = 'md', className }: { size?: Size; className?: string }) {
  const { paymentLogos } = useSiteSettings();
  const active = paymentLogos.filter((l) => l.enabled);
  if (active.length === 0) return null;
  return (
    <div className={classNames('flex flex-wrap items-center gap-1.5', className)}>
      {active.map((logo) => (
        <PaymentLogoChip key={logo.id} logo={logo} size={size} />
      ))}
    </div>
  );
}

// Logo de Servientrega (o el que se suba desde el panel).
export function CourierLogo({ size = 'md', className, courier: override }: { size?: Size; className?: string; courier?: CourierSettings }) {
  const settings = useSiteSettings();
  const courier = override ?? settings.courier;
  return (
    <span
      title={courier.name}
      className={classNames(
        'inline-flex shrink-0 items-center justify-center bg-white shadow-sm ring-1 ring-black/10',
        FRAME[size],
        className,
      )}
    >
      {courier.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={courier.logoUrl} alt={courier.name} className={classNames('w-auto object-contain', size === 'sm' ? 'h-4 max-w-[90px]' : 'h-6 max-w-[120px]')} />
      ) : courier.name.toLowerCase() === 'servientrega' ? (
        <span className={classNames('flex items-center gap-1 font-black lowercase italic leading-none text-[#00953B]', size === 'sm' ? 'text-[11px]' : 'text-[14px]')}>
          <span className={classNames('inline-block -skew-x-12 rounded-sm bg-[#FFD200]', size === 'sm' ? 'h-2.5 w-1.5' : 'h-3.5 w-2')} />
          servientrega
        </span>
      ) : (
        <span className="text-[12px] font-extrabold text-ink">{courier.name}</span>
      )}
    </span>
  );
}
