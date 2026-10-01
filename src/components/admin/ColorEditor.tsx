'use client';

import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { LOGO_PATTERNS, PATTERNS, logoPatternUri, swatchBackground } from '@/components/ColorSwatch';
import type { ColorPattern } from '@/lib/types';
import { colorName } from '@/lib/colorDetect';
import { classNames } from '@/lib/utils';

export interface ColorValue {
  name: string;
  hex: string;
  hex2?: string;
  // Color del logo / detalles (opcional).
  hex3?: string;
  // Estampado (animal print, camuflaje, multicolor...).
  pattern?: ColorPattern;
  // Estampado solo del logo / detalles.
  logoPattern?: ColorPattern;
  // Foto asociada (para la muestra con foto). Se conserva tal cual.
  image?: string;
}

// Qué tonos usa cada estampado.
const PATTERN_PARTS: Record<ColorPattern, { hex2?: string; hex3?: string }> = {
  leopardo: { hex2: 'Manchas', hex3: 'Centro de manchas' },
  cebra: { hex2: 'Franjas' },
  vaca: { hex2: 'Manchas' },
  serpiente: { hex2: 'Escamas' },
  camuflaje: { hex2: 'Manchas', hex3: 'Manchas claras' },
  multicolor: { hex2: 'Color 2', hex3: 'Color 3' },
  degradado: { hex2: 'Color final' },
  foto: {},
};

function patternName(pattern: ColorPattern, hex: string, hex2?: string): string {
  switch (pattern) {
    case 'leopardo':
      return 'Animal print leopardo';
    case 'cebra':
      return 'Animal print cebra';
    case 'vaca':
      return 'Animal print vaca';
    case 'serpiente':
      return 'Animal print pitón';
    case 'camuflaje':
      return 'Camuflaje';
    case 'multicolor':
      return 'Multicolor';
    case 'degradado':
      return `Degradado ${toneName(hex).toLowerCase()} / ${toneName(hex2 ?? hex).toLowerCase()}`;
    default:
      return 'Estampado';
  }
}

// Silueta de zapatilla (para rellenar con el estampado en la vista previa).
const SNEAKER_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M16 70 L20 48 Q23 36 40 35 Q46 26 60 26 L66 33 Q82 20 102 23 L118 29 Q150 40 175 52 Q192 59 190 71 L192 70 L192 76 Q192 86 178 86 L24 86 Q10 86 10 76 L10 70 Z" fill="black"/></svg>',
)}")`;

// Paleta de colores de zapatos (capellada y suela) con su nombre comercial.
export const SHOE_PALETTE: { name: string; hex: string }[] = [
  { name: 'Negro', hex: '#111111' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Blanco hueso', hex: '#F2EDE3' },
  { name: 'Crema', hex: '#EFE3C8' },
  { name: 'Beige', hex: '#D9C7A7' },
  { name: 'Arena', hex: '#C8B08A' },
  { name: 'Miel', hex: '#D9B77E' },
  { name: 'Gris claro', hex: '#D1D5DB' },
  { name: 'Gris', hex: '#9CA3AF' },
  { name: 'Plomo', hex: '#4B5563' },
  { name: 'Azul marino', hex: '#1E2A5A' },
  { name: 'Azul', hex: '#2563EB' },
  { name: 'Celeste', hex: '#93C5FD' },
  { name: 'Verde', hex: '#15803D' },
  { name: 'Verde oliva', hex: '#6B7045' },
  { name: 'Menta', hex: '#A7E3C9' },
  { name: 'Amarillo', hex: '#FACC15' },
  { name: 'Mostaza', hex: '#C9A227' },
  { name: 'Naranja', hex: '#F97316' },
  { name: 'Rojo', hex: '#DC2626' },
  { name: 'Vino', hex: '#7F1D1D' },
  { name: 'Rosado', hex: '#F9A8D4' },
  { name: 'Rosa palo', hex: '#E8C4C0' },
  { name: 'Lila', hex: '#C4B5FD' },
  { name: 'Morado', hex: '#6D28D9' },
  { name: 'Café', hex: '#6B4226' },
  { name: 'Camel', hex: '#B07A45' },
  { name: 'Goma', hex: '#B5835A' },
  { name: 'Dorado', hex: '#C9A24A' },
  { name: 'Plateado', hex: '#C0C4CC' },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.padEnd(6, '0');
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

// Nombre de un tono: el de la paleta si coincide, o uno aproximado.
export function toneName(hex: string): string {
  const match = SHOE_PALETTE.find((p) => p.hex.toLowerCase() === hex.toLowerCase());
  return match ? match.name : colorName(hexToRgb(hex));
}

function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

function suggestedName(hex: string, hex2?: string, hex3?: string, pattern?: ColorPattern, logoPattern?: ColorPattern): string {
  if (pattern) return patternName(pattern, hex, hex2);
  if (hex3 && logoPattern) {
    const a = toneName(hex);
    const b = hex2 ? toneName(hex2) : a;
    const base = a === b ? a : `${a} / ${b}`;
    const print = patternName(logoPattern, hex3).toLowerCase().replace('degradado', 'en degradado');
    return `${base} con logo ${print}`;
  }
  const a = toneName(hex);
  const b = hex2 ? toneName(hex2) : a;
  const base = a === b ? a : `${a} / ${b}`;
  if (!hex3) return base;
  const c = toneName(hex3);
  return c === a ? base : `${base} con logo ${c.toLowerCase()}`;
}

// Zapatilla de referencia que se pinta con los colores elegidos.
export function SneakerPreview({
  hex,
  hex2,
  hex3,
  logoPattern,
  className,
}: {
  hex: string;
  hex2?: string;
  hex3?: string;
  logoPattern?: ColorPattern;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const sole = hex2 ?? hex;
  const logoUri = hex3 && logoPattern ? logoPatternUri(logoPattern, hex3) : null;
  const tile = logoPattern === 'serpiente' ? [9, 8] : logoPattern === 'multicolor' || logoPattern === 'degradado' ? [40, 40] : [16, 16];
  const logoFill = logoUri ? `url(#logo-${uid})` : hex3 ?? 'transparent';
  const stroke = isDark(hex) ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';
  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden>
      {logoUri && (
        <defs>
          <pattern id={`logo-${uid}`} patternUnits="userSpaceOnUse" width={tile[0]} height={tile[1]} x="56" y="40">
            <image href={logoUri} width={tile[0]} height={tile[1]} preserveAspectRatio="none" />
          </pattern>
        </defs>
      )}
      <ellipse cx="100" cy="92" rx="88" ry="5" fill="rgba(0,0,0,0.35)" />
      {/* Capellada */}
      <path d="M16 70 L20 48 Q23 36 40 35 L66 33 Q82 20 102 23 L118 29 Q150 40 175 52 Q192 59 190 71 Z" fill={hex} stroke={stroke} strokeWidth="1" />
      {/* Cuello y lengüeta */}
      <path d="M40 35 Q46 26 60 26 L68 33 Z" fill={hex} stroke={stroke} strokeWidth="1" />
      {/* Cordones */}
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={78 + i * 12} y1={30 + i * 3} x2={86 + i * 12} y2={38 + i * 3} stroke={stroke} strokeWidth="2.2" strokeLinecap="round" />
      ))}
      {/* Logo / detalles */}
      <path
        d={logoUri ? 'M52 64 Q102 68 160 42 Q120 68 62 58 Z' : 'M58 62 Q102 64 156 44 Q118 64 66 58 Z'}
        fill={logoFill}
        stroke={hex3 ? (logoUri ? stroke : 'none') : stroke}
        strokeWidth={logoUri ? 0.6 : 1}
        strokeDasharray={hex3 ? undefined : '3 3'}
      />
      <circle cx="30" cy="56" r={logoUri ? 5.5 : 4.5} fill={logoFill} stroke={hex3 ? (logoUri ? stroke : 'none') : stroke} strokeWidth={logoUri ? 0.6 : 1} />
      {/* Suela */}
      <path d="M10 70 L192 70 L192 76 Q192 86 178 86 L24 86 Q10 86 10 76 Z" fill={sole} stroke={isDark(sole) ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'} strokeWidth="1" />
      <line x1="14" y1="78" x2="188" y2="78" stroke={isDark(sole) ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'} strokeWidth="1" />
    </svg>
  );
}

// Descripción corta de los tonos de un color.
export function toneSummary(c: { hex2?: string; hex3?: string; pattern?: ColorPattern; logoPattern?: ColorPattern }): string {
  if (!c.pattern && c.hex3 && c.logoPattern) return `Logo estampado · ${PATTERNS.find((p) => p.key === c.logoPattern)?.label ?? ''}`;
  if (c.pattern) return c.pattern === 'foto' ? 'Muestra con foto' : `Estampado · ${PATTERNS.find((p) => p.key === c.pattern)?.label ?? ''}`;
  if (c.hex2 && c.hex3) return 'Capellada, suela y logo';
  if (c.hex3) return 'Un tono + logo';
  return c.hex2 ? 'Dos tonos · capellada / suela' : 'Un tono';
}

// Muestra redonda que abre el editor al tocarla.
export function ColorChipButton({ value, onClick, size = 'md' }: { value: ColorValue; onClick: () => void; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Editar color"
      className={classNames(
        'group relative shrink-0 rounded-full ring-2 ring-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)] transition-transform hover:scale-110',
        size === 'sm' ? 'h-7 w-7' : 'h-10 w-10',
      )}
      style={{
        background: swatchBackground(value.hex, value.hex2, value.hex3, { pattern: value.pattern, image: value.image, logoPattern: value.logoPattern }),
      }}
    >
      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[8px] text-white opacity-90 group-hover:opacity-100">
        ✎
      </span>
    </button>
  );
}

/**
 * Editor de color de un zapato: capellada, suela (opcional) y logo /
 * detalles (opcional), con paleta, tono personalizado, vista previa de la
 * zapatilla y nombre sugerido automáticamente.
 */
export default function ColorEditor({
  open,
  value,
  title = 'Editar color',
  image,
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean;
  value: ColorValue;
  title?: string;
  // Foto del zapato de este color (habilita "Usar la foto" como muestra).
  image?: string;
  onClose: () => void;
  onSave: (value: ColorValue) => void;
  onRemove?: () => void;
}) {
  const [hex, setHex] = useState(value.hex);
  const [hex2, setHex2] = useState<string | undefined>(value.hex2);
  const [hex3, setHex3] = useState<string | undefined>(value.hex3);
  const [part, setPart] = useState<'upper' | 'sole' | 'logo'>('upper');
  const [pattern, setPattern] = useState<ColorPattern | undefined>(value.pattern);
  const [logoPattern, setLogoPattern] = useState<ColorPattern | undefined>(value.logoPattern);
  const [name, setName] = useState(value.name);
  const [nameTouched, setNameTouched] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    setHex(value.hex);
    setHex2(value.hex2);
    setHex3(value.hex3);
    setPattern(value.pattern);
    setLogoPattern(value.logoPattern);
    setName(value.name);
    setPart('upper');
    // Si el nombre actual es el sugerido, lo seguimos actualizando solo.
    setNameTouched(value.name.trim() !== '' && value.name !== suggestedName(value.hex, value.hex2, value.hex3, value.pattern, value.logoPattern));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, value, onClose]);

  const twoTone = hex2 !== undefined;
  const hasLogo = hex3 !== undefined;
  const effectiveName = nameTouched ? name : suggestedName(hex, hex2, hex3, pattern, hasLogo ? logoPattern : undefined);

  function chooseLogoPattern(next: ColorPattern | undefined) {
    setLogoPattern(next);
    if (next) {
      const preset = PATTERNS.find((p) => p.key === next)!.defaults;
      setHex3(preset.hex);
    }
  }
  const previewImage = image ?? value.image;

  function choosePattern(next: ColorPattern | undefined) {
    if (next === pattern) return;
    if (!next) {
      setPattern(undefined);
      setHex2(undefined);
      setHex3(undefined);
      setPart('upper');
      return;
    }
    const preset = PATTERNS.find((p) => p.key === next)!.defaults;
    setPattern(next);
    setHex(preset.hex);
    setHex2(PATTERN_PARTS[next].hex2 ? preset.hex2 : undefined);
    setHex3(PATTERN_PARTS[next].hex3 ? preset.hex3 : undefined);
    setPart('upper');
  }

  function pick(color: string) {
    if (part === 'sole' && twoTone) setHex2(color);
    else if (part === 'logo' && hasLogo) setHex3(color);
    else setHex(color);
  }

  function setTwoTone(on: boolean) {
    if (on) {
      setHex2((h) => h ?? (hex.toLowerCase() === '#ffffff' ? '#111111' : '#FFFFFF'));
      setPart('sole');
    } else {
      setHex2(undefined);
      setPart('upper');
    }
  }

  function setLogo(on: boolean) {
    if (on) {
      setHex3((h) => h ?? (isDark(hex) ? '#FFFFFF' : '#111111'));
      setPart('logo');
    } else {
      setHex3(undefined);
      setPart('upper');
    }
  }

  const activeHex = part === 'sole' && twoTone ? hex2! : part === 'logo' && hasLogo ? hex3! : hex;
  const patternParts = pattern ? PATTERN_PARTS[pattern] : null;
  const parts = patternParts
    ? pattern === 'foto'
      ? []
      : [
          { key: 'upper' as const, label: pattern === 'multicolor' ? 'Color 1' : pattern === 'degradado' ? 'Color inicial' : 'Fondo', color: hex },
          ...(patternParts.hex2 && hex2 ? [{ key: 'sole' as const, label: patternParts.hex2, color: hex2 }] : []),
          ...(patternParts.hex3 && hex3 ? [{ key: 'logo' as const, label: patternParts.hex3, color: hex3 }] : []),
        ]
    : [
        { key: 'upper' as const, label: 'Capellada', color: hex },
        ...(twoTone ? [{ key: 'sole' as const, label: 'Suela', color: hex2! }] : []),
        ...(hasLogo ? [{ key: 'logo' as const, label: 'Logo / detalles', color: hex3! }] : []),
      ];
  const partLabel = (parts.find((p) => p.key === part)?.label ?? parts[0]?.label ?? '').toLowerCase();
  const background = swatchBackground(hex, hex2, hex3, { pattern, image: previewImage, logoPattern: hasLogo ? logoPattern : undefined });
  const logoPart = !pattern && hasLogo && part === 'logo';

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-md animate-slideUp overflow-y-auto rounded-t-3xl bg-white p-5 shadow-dark sm:rounded-3xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary-hover">{title}</p>
            <p className="mt-0.5 text-lg font-black text-ink">{effectiveName || 'Color'}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-alt text-ink" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {/* Vista previa */}
        <div className="mt-4 rounded-2xl bg-[radial-gradient(ellipse_at_50%_0%,#2a2a2a,#0a0a0a_70%)] p-4 text-white">
          {pattern ? (
            <div className="relative mx-auto h-28 w-full max-w-[260px]">
              <div
                className="absolute inset-0"
                style={{
                  background: pattern === 'foto' ? background : background.replace(/22px 22px|9px 8px/, (m) => (m === '9px 8px' ? '12px 11px' : '34px 34px')),
                  WebkitMaskImage: SNEAKER_MASK,
                  maskImage: SNEAKER_MASK,
                  WebkitMaskSize: 'contain',
                  maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat',
                  maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center',
                  maskPosition: 'center',
                }}
              />
            </div>
          ) : (
            <SneakerPreview hex={hex} hex2={hex2} hex3={hex3} logoPattern={hasLogo ? logoPattern : undefined} className="mx-auto h-28 w-full max-w-[260px]" />
          )}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px]">
            {parts.map((p) => (
              <span key={p.key} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full ring-1 ring-white/40" style={{ background: p.color }} />
                {p.label}:{' '}
                <strong>
                  {p.key === 'logo' && !pattern && logoPattern
                    ? `${PATTERNS.find((x) => x.key === logoPattern)?.label} (fondo ${toneName(p.color).toLowerCase()})`
                    : toneName(p.color)}
                </strong>
              </span>
            ))}
            {pattern === 'foto' && <span className="text-white/70">La muestra usa un acercamiento de la foto del zapato</span>}
            <span className="ml-1 h-6 w-6 rounded-full ring-2 ring-white/20" style={{ background }} title="Así se ve la muestra en la tienda" />
          </div>
        </div>

        {/* Liso / estampado */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-cream-alt p-1">
          {[
            { on: false, label: 'Liso' },
            { on: true, label: 'Estampado' },
          ].map((o) => (
            <button
              key={o.label}
              type="button"
              onClick={() => choosePattern(o.on ? pattern ?? 'leopardo' : undefined)}
              className={classNames(
                'rounded-full py-2 text-xs font-extrabold uppercase tracking-wider transition-colors',
                !!pattern === o.on ? 'bg-ink text-white shadow-dark' : 'text-muted',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        {pattern ? (
          <div className="mt-3 grid grid-cols-4 gap-2">
            {PATTERNS.map((p) => {
              const disabled = p.key === 'foto' && !previewImage;
              const d = p.defaults;
              return (
                <button
                  key={p.key}
                  type="button"
                  disabled={disabled}
                  onClick={() => choosePattern(p.key)}
                  title={disabled ? 'Primero asigna una foto a este color' : p.label}
                  className={classNames(
                    'flex flex-col items-center gap-1.5 rounded-xl p-2 text-center text-[10px] font-bold leading-tight ring-2 transition-colors disabled:opacity-40',
                    pattern === p.key ? 'bg-gold-50 text-ink ring-primary' : 'bg-white text-muted ring-border',
                  )}
                >
                  <span
                    className="h-9 w-9 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
                    style={{
                      background:
                        pattern === p.key ? background : swatchBackground(d.hex, d.hex2, d.hex3, { pattern: p.key, image: previewImage }),
                    }}
                  />
                  {p.label}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            {/* Un color / dos colores */}
            <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-cream-alt p-1">
              {[
                { on: false, label: 'Un color' },
                { on: true, label: 'Dos colores' },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setTwoTone(o.on)}
                  className={classNames(
                    'rounded-full py-2 text-xs font-extrabold uppercase tracking-wider transition-colors',
                    twoTone === o.on ? 'bg-ink text-white shadow-dark' : 'text-muted',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Logo / detalles */}
            <button
              type="button"
              onClick={() => setLogo(!hasLogo)}
              className={classNames(
                'mt-2 flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold ring-1 transition-colors',
                hasLogo ? 'bg-gold-50 text-ink ring-primary/50' : 'bg-white text-muted ring-border hover:text-ink',
              )}
            >
              <span>🏷️ Color del logo / detalles (franjas, costuras, talón)</span>
              <span className={classNames('relative h-5 w-9 shrink-0 rounded-full transition-colors', hasLogo ? 'bg-primary' : 'bg-border')}>
                <span className={classNames('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all', hasLogo ? 'left-[18px]' : 'left-0.5')} />
              </span>
            </button>
          </>
        )}

        {parts.length > 1 && (
          <div className={classNames('mt-3 grid gap-2', parts.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
            {parts.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPart(p.key)}
                className={classNames(
                  'flex items-center gap-2 rounded-xl px-2.5 py-2.5 text-left text-[11px] font-bold leading-tight ring-2 transition-colors',
                  part === p.key ? 'bg-gold-50 text-ink ring-primary' : 'bg-white text-muted ring-border',
                )}
              >
                <span className="h-5 w-5 shrink-0 rounded-full ring-1 ring-black/15" style={{ background: p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Estampado solo del logo */}
        {logoPart && (
          <div className="mt-4">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-muted">Estampado del logo / detalles</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[{ key: undefined, label: 'Liso' }, ...LOGO_PATTERNS.map((p) => ({ key: p.key, label: p.label }))].map((p) => {
                const selected = logoPattern === p.key;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => chooseLogoPattern(p.key)}
                    className={classNames(
                      'flex w-[68px] shrink-0 flex-col items-center gap-1 rounded-xl p-1.5 text-center text-[9px] font-bold leading-tight ring-2 transition-colors',
                      selected ? 'bg-gold-50 text-ink ring-primary' : 'bg-white text-muted ring-border',
                    )}
                  >
                    <span
                      className="h-8 w-8 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.15)]"
                      style={{
                        background: p.key
                          ? (() => {
                              const uri = logoPatternUri(p.key, selected && hex3 ? hex3 : PATTERNS.find((x) => x.key === p.key)!.defaults.hex);
                              return uri ? `url("${uri}") center / ${p.key === 'serpiente' ? '9px 8px' : p.key === 'multicolor' || p.key === 'degradado' ? 'cover' : '16px 16px'} repeat` : '#eee';
                            })()
                          : hex3,
                      }}
                    />
                    {p.label}
                  </button>
                );
              })}
            </div>
            {logoPattern && <p className="mt-1 text-[10px] text-muted">El color que elijas abajo es el fondo del estampado del logo.</p>}
          </div>
        )}

        {/* Paleta */}
        {pattern !== 'foto' && (
        <>
        <p className="mb-2 mt-4 text-[10px] font-extrabold uppercase tracking-wider text-muted">
          {parts.length > 1 ? `Elige el color: ${partLabel}` : 'Elige el color'}
        </p>
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {SHOE_PALETTE.map((c) => {
            const selected = activeHex.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => pick(c.hex)}
                title={c.name}
                aria-label={c.name}
                className={classNames(
                  'relative aspect-square rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.15)] transition-transform hover:scale-110',
                  selected && 'ring-2 ring-primary ring-offset-2',
                )}
                style={{ background: c.hex }}
              >
                {selected && (
                  <span className={classNames('absolute inset-0 flex items-center justify-center text-xs font-black', isDark(c.hex) ? 'text-white' : 'text-ink')}>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl bg-cream-alt/70 px-3 py-2.5 text-xs font-bold text-ink">
          <input type="color" value={activeHex} onChange={(e) => pick(e.target.value.toUpperCase())} className="h-8 w-10 cursor-pointer rounded-md border border-border" />
          🎨 Otro tono exacto (personalizado)
        </label>
        </>
        )}

        {/* Nombre */}
        <label className="mt-4 block">
          <span className="mb-1 flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Nombre que ve el cliente</span>
            {nameTouched && (
              <button type="button" onClick={() => setNameTouched(false)} className="text-[11px] font-bold text-primary-hover">
                Usar sugerido
              </button>
            )}
          </span>
          <input
            value={effectiveName}
            onChange={(e) => {
              setNameTouched(true);
              setName(e.target.value);
            }}
            placeholder="Ej: Blanco / Negro"
            className="input"
          />
        </label>

        <div className="mt-5 flex gap-2">
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="rounded-full px-4 py-3 text-xs font-extrabold text-urgent hover:bg-urgent/10"
            >
              🗑 Quitar
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              const finalName = effectiveName.trim() || suggestedName(hex, hex2, hex3, pattern);
              // Solo se guardan los tonos usados (Firestore no acepta undefined).
              const result: ColorValue = { name: finalName, hex };
              if (pattern) {
                result.pattern = pattern;
                if (PATTERN_PARTS[pattern].hex2 && hex2) result.hex2 = hex2;
                if (PATTERN_PARTS[pattern].hex3 && hex3) result.hex3 = hex3;
              } else {
                if (twoTone && hex2 && hex2.toLowerCase() !== hex.toLowerCase()) result.hex2 = hex2;
                if (hasLogo && hex3) result.hex3 = hex3;
                if (hasLogo && hex3 && logoPattern) result.logoPattern = logoPattern;
              }
              if (value.image) result.image = value.image;
              onSave(result);
              onClose();
            }}
            className="btn-primary btn-shine flex-1 py-3.5"
          >
            ✓ Listo
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
