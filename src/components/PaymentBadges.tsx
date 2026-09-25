import { classNames } from '@/lib/utils';

// Insignias de las formas de pago aceptadas en Ecuador.
export default function PaymentBadges({ className, dark = false }: { className?: string; dark?: boolean }) {
  const chip = dark
    ? 'rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white ring-1 ring-white/15'
    : 'rounded-md bg-white px-2.5 py-1 text-[11px] font-bold text-ink ring-1 ring-border';
  return (
    <div className={classNames('flex flex-wrap items-center gap-2', className)}>
      <span className={chip}>🏦 Transferencia</span>
      <span className={chip}>🧾 Depósito Pichincha</span>
      <span className={chip}>💵 Contra entrega</span>
    </div>
  );
}
