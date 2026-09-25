import { classNames } from '@/lib/utils';

// Etiqueta fina "Nº1 · Más vendida": negro con borde dorado de 1px y texto
// dorado degradado. Reemplaza las píldoras amarillas planas.
export default function StarTag({
  label = 'Más vendida',
  className,
  size = 'sm',
}: {
  label?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-primary/70 bg-ink/90 font-extrabold uppercase text-primary-light shadow-[0_6px_18px_rgba(0,0,0,0.25)] backdrop-blur',
        size === 'xs' && 'px-2 py-0.5 text-[9px] tracking-[0.14em]',
        size === 'sm' && 'px-2.5 py-1 text-[10px] tracking-[0.16em]',
        size === 'md' && 'px-3.5 py-1.5 text-[11px] tracking-[0.2em]',
        className,
      )}
    >
      <span className="font-display text-[1.15em] normal-case italic tracking-normal text-gold-gradient">Nº1</span>
      <span className="h-2.5 w-px bg-primary/60" />
      {label}
    </span>
  );
}
