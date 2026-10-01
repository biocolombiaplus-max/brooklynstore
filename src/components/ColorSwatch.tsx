import type { ColorPattern } from '@/lib/types';
import { classNames } from '@/lib/utils';

// Estampados disponibles para los colores de un producto.
export const PATTERNS: { key: ColorPattern; label: string; icon: string; defaults: { hex: string; hex2: string; hex3?: string } }[] = [
  { key: 'leopardo', label: 'Leopardo', icon: '🐆', defaults: { hex: '#D9B77E', hex2: '#2B1B10', hex3: '#8B5A2B' } },
  { key: 'cebra', label: 'Cebra', icon: '🦓', defaults: { hex: '#F5F5F5', hex2: '#111111' } },
  { key: 'vaca', label: 'Vaca / dálmata', icon: '🐄', defaults: { hex: '#FFFFFF', hex2: '#111111' } },
  { key: 'serpiente', label: 'Serpiente / pitón', icon: '🐍', defaults: { hex: '#D8CBB0', hex2: '#5B4A35' } },
  { key: 'camuflaje', label: 'Camuflaje', icon: '🪖', defaults: { hex: '#6B7045', hex2: '#3E4429', hex3: '#A89A6E' } },
  { key: 'multicolor', label: 'Multicolor', icon: '🌈', defaults: { hex: '#F97316', hex2: '#2563EB', hex3: '#FACC15' } },
  { key: 'degradado', label: 'Degradado', icon: '🎨', defaults: { hex: '#93C5FD', hex2: '#F9A8D4' } },
  { key: 'foto', label: 'Usar la foto', icon: '📷', defaults: { hex: '#D1D5DB', hex2: '#9CA3AF' } },
];

const svgUrl = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

// Estampados que se pueden usar solo en el logo / detalles.
export const LOGO_PATTERNS = PATTERNS.filter((p) => p.key !== 'foto');

/**
 * Imagen (data URI) de un estampado: dibujo repetible para animal print y
 * camuflaje; muestra completa para multicolor y degradado.
 */
export function patternDataUri(pattern: ColorPattern, hex: string, hex2: string, hex3: string): string | null {
  if (pattern === 'multicolor') {
    const colors = [hex, hex2, hex3, '#15803D', '#DC2626'];
    const slices = colors
      .map((c, i) => {
        const a0 = (i / colors.length) * Math.PI * 2;
        const a1 = ((i + 1) / colors.length) * Math.PI * 2;
        const p = (a: number) => `${(20 + 30 * Math.sin(a)).toFixed(2)} ${(20 - 30 * Math.cos(a)).toFixed(2)}`;
        return `<path d="M20 20 L${p(a0)} A30 30 0 0 1 ${p(a1)} Z" fill="${c}"/>`;
      })
      .join('');
    return svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">${slices}</svg>`);
  }
  if (pattern === 'degradado') {
    return svgUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${hex}"/><stop offset="1" stop-color="${hex2}"/></linearGradient></defs><rect width="40" height="40" fill="url(#g)"/></svg>`,
    );
  }
  return patternTile(pattern, hex, hex2, hex3);
}

// Dibujo repetible (SVG) de cada estampado animal / camuflaje.
function patternTile(pattern: ColorPattern, hex: string, hex2: string, hex3: string): string | null {
  switch (pattern) {
    case 'leopardo':
      return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${hex}"/>` +
          [
            [9, 9, 5.5, 4.2],
            [29, 13, 5, 4],
            [17, 29, 5.5, 4.5],
            [35, 33, 4, 3.4],
            [3, 30, 3.6, 3],
          ]
            .map(
              ([x, y, rx, ry]) =>
                `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${hex3}" stroke="${hex2}" stroke-width="2.2" stroke-dasharray="6 2.5" transform="rotate(${(x * 7) % 50} ${x} ${y})"/>`,
            )
            .join('') +
          `<circle cx="22" cy="5" r="1.6" fill="${hex2}"/><circle cx="3" cy="17" r="1.4" fill="${hex2}"/><circle cx="31" cy="25" r="1.3" fill="${hex2}"/></svg>`,
      );
    case 'cebra':
      return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><rect width="40" height="40" fill="${hex}"/>` +
          `<path d="M-2 4 Q10 0 20 6 T42 4 L42 8 Q30 12 20 9 T-2 9Z M-2 18 Q12 13 22 20 T42 17 L42 22 Q30 25 22 23 T-2 23Z M-2 31 Q8 27 18 33 T42 30 L42 35 Q28 38 18 36 T-2 36Z" fill="${hex2}"/></svg>`,
      );
    case 'vaca':
      return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect width="44" height="44" fill="${hex}"/>` +
          `<path d="M6 6 Q14 2 17 9 Q20 15 12 17 Q4 18 3 12 Q2 8 6 6Z" fill="${hex2}"/>` +
          `<path d="M28 20 Q37 17 40 24 Q42 31 34 33 Q26 34 25 27 Q24 22 28 20Z" fill="${hex2}"/>` +
          `<path d="M8 32 Q13 29 15 34 Q16 39 11 40 Q6 40 6 36Z" fill="${hex2}"/><circle cx="30" cy="7" r="2.6" fill="${hex2}"/></svg>`,
      );
    case 'serpiente':
      return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" viewBox="0 0 16 14"><rect width="16" height="14" fill="${hex}"/>` +
          `<path d="M0 7 L4 0 L12 0 L16 7 L12 14 L4 14Z" fill="none" stroke="${hex2}" stroke-width="1.2" opacity="0.85"/>` +
          `<path d="M4 3 L6 0 M10 14 L12 11" stroke="${hex2}" stroke-width="0.8" opacity="0.5"/></svg>`,
      );
    case 'camuflaje':
      return svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" fill="${hex}"/>` +
          `<path d="M2 6 Q12 0 20 8 Q26 14 16 20 Q6 24 2 16Z M30 4 Q42 2 46 12 Q48 20 38 20 Q28 18 30 4Z M18 30 Q30 24 36 34 Q40 44 26 46 Q14 46 18 30Z" fill="${hex2}"/>` +
          `<path d="M24 12 Q32 10 34 16 Q34 22 26 21 Q20 19 24 12Z M2 30 Q10 28 12 36 Q12 44 4 44 Q0 40 2 30Z M38 30 Q46 28 46 36 Q44 42 38 40Z" fill="${hex3}"/></svg>`,
      );
    default:
      return null;
  }
}

/**
 * Fondo CSS de una muestra de color. Un tono, dos tonos en diagonal
 * (capellada / suela), logo como punto al centro, estampados (animal print,
 * camuflaje, multicolor, degradado) o un acercamiento de la foto del zapato.
 */
export function swatchBackground(
  hex: string,
  hex2?: string,
  hex3?: string,
  extra?: { pattern?: ColorPattern; image?: string; logoPattern?: ColorPattern },
): string {
  const pattern = extra?.pattern;
  if (pattern === 'foto' && extra?.image) return `url("${extra.image}") 50% 55% / 260% auto no-repeat, ${hex}`;
  if (pattern === 'multicolor') {
    const stops = [hex, hex2 ?? '#2563EB', hex3 ?? '#FACC15', '#15803D', '#DC2626'];
    return `conic-gradient(from 20deg, ${stops.map((c, i) => `${c} ${i * 20}% ${(i + 1) * 20}%`).join(', ')})`;
  }
  if (pattern === 'degradado') return `linear-gradient(135deg, ${hex}, ${hex2 ?? '#FFFFFF'})`;
  if (pattern && pattern !== 'foto') {
    const tile = patternTile(pattern, hex, hex2 ?? '#111111', hex3 ?? hex2 ?? '#111111');
    if (tile) return `url("${tile}") 0 0 / ${pattern === 'serpiente' ? '9px 8px' : '22px 22px'} repeat, ${hex}`;
  }
  const base = hex2 ? `linear-gradient(135deg, ${hex} 0 50%, ${hex2} 50% 100%)` : `linear-gradient(${hex}, ${hex})`;
  if (hex3 && extra?.logoPattern) {
    // Logo con estampado: punto central relleno con el estampado.
    const uri = logoPatternUri(extra.logoPattern, hex3);
    if (uri) {
      const overlay = svgUrl(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100"><defs><pattern id="p" patternUnits="userSpaceOnUse" width="${extra.logoPattern === 'serpiente' ? 14 : 30}" height="${extra.logoPattern === 'serpiente' ? 12 : 30}"><image href="${uri}" xlink:href="${uri}" width="${extra.logoPattern === 'serpiente' ? 14 : 30}" height="${extra.logoPattern === 'serpiente' ? 12 : 30}" preserveAspectRatio="none"/></pattern></defs><circle cx="50" cy="50" r="31" fill="rgba(255,255,255,0.9)"/><circle cx="50" cy="50" r="25" fill="url(#p)"/></svg>`,
      );
      return `url("${overlay}") center / 100% 100% no-repeat, ${base}`;
    }
  }
  return hex3 ? `radial-gradient(circle at 50% 50%, ${hex3} 0 24%, rgba(255,255,255,0.9) 25% 31%, transparent 32%), ${base}` : hex2 ? base : hex;
}

// Estampado del logo: el color del logo es el fondo y el resto de tonos
// salen del estampado elegido.
export function logoPatternUri(pattern: ColorPattern, base: string): string | null {
  const preset = PATTERNS.find((p) => p.key === pattern)?.defaults;
  if (!preset || pattern === 'foto') return null;
  return patternDataUri(pattern, base, preset.hex2, preset.hex3 ?? preset.hex2);
}

// Atajo para un color de producto completo.
export function colorBackground(c: {
  hex: string;
  hex2?: string;
  hex3?: string;
  pattern?: ColorPattern;
  logoPattern?: ColorPattern;
  image?: string;
}): string {
  return swatchBackground(c.hex, c.hex2, c.hex3, { pattern: c.pattern, image: c.image, logoPattern: c.logoPattern });
}

export default function ColorSwatch({
  hex,
  hex2,
  hex3,
  pattern,
  logoPattern,
  image,
  className,
  title,
}: {
  hex: string;
  hex2?: string;
  hex3?: string;
  pattern?: ColorPattern;
  logoPattern?: ColorPattern;
  image?: string;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={classNames('inline-block shrink-0 rounded-full border border-black/15 shadow-inner', className)}
      style={{ background: swatchBackground(hex, hex2, hex3, { pattern, image, logoPattern }) }}
    />
  );
}
