import { classNames } from '@/lib/utils';

// Muestra de color: un tono, o dos tonos en diagonal (ej. capellada blanca
// con suela negra), como en las tiendas de zapatillas. El color del logo /
// detalles, si existe, se ve como un punto al centro.
export function swatchBackground(hex: string, hex2?: string, hex3?: string): string {
  const base = hex2 ? `linear-gradient(135deg, ${hex} 0 50%, ${hex2} 50% 100%)` : `linear-gradient(${hex}, ${hex})`;
  return hex3 ? `radial-gradient(circle at 50% 50%, ${hex3} 0 24%, rgba(255,255,255,0.9) 25% 31%, transparent 32%), ${base}` : hex2 ? base : hex;
}

export default function ColorSwatch({
  hex,
  hex2,
  hex3,
  className,
  title,
}: {
  hex: string;
  hex2?: string;
  hex3?: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={classNames('inline-block shrink-0 rounded-full border border-black/15 shadow-inner', className)}
      style={{ background: swatchBackground(hex, hex2, hex3) }}
    />
  );
}
