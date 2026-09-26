import { classNames } from '@/lib/utils';

// Muestra de color: un tono, o dos tonos en diagonal (ej. capellada blanca
// con suela negra), como en las tiendas de zapatillas.
export function swatchBackground(hex: string, hex2?: string): string {
  return hex2 ? `linear-gradient(135deg, ${hex} 0 50%, ${hex2} 50% 100%)` : hex;
}

export default function ColorSwatch({
  hex,
  hex2,
  className,
  title,
}: {
  hex: string;
  hex2?: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={classNames('inline-block shrink-0 rounded-full border border-black/15 shadow-inner', className)}
      style={{ background: swatchBackground(hex, hex2) }}
    />
  );
}
