'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { swatchBackground } from '@/components/ColorSwatch';
import { colorName } from '@/lib/colorDetect';
import { classNames } from '@/lib/utils';

export interface ColorValue {
  name: string;
  hex: string;
  hex2?: string;
  // Color del logo / detalles (opcional).
  hex3?: string;
}

// Paleta de colores de zapatos (capellada y suela) con su nombre comercial.
export const SHOE_PALETTE: { name: string; hex: string }[] = [
  { name: 'Negro', hex: '#111111' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Blanco hueso', hex: '#F2EDE3' },
  { name: 'Crema', hex: '#EFE3C8' },
  { name: 'Beige', hex: '#D9C7A7' },
  { name: 'Arena', hex: '#C8B08A' },
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

function suggestedName(hex: string, hex2?: string, hex3?: string): string {
  const a = toneName(hex);
  const b = hex2 ? toneName(hex2) : a;
  const base = a === b ? a : `${a} / ${b}`;
  if (!hex3) return base;
  const c = toneName(hex3);
  return c === a ? base : `${base} con logo ${c.toLowerCase()}`;
}

// Zapatilla de referencia que se pinta con los colores elegidos.
export function SneakerPreview({ hex, hex2, hex3, className }: { hex: string; hex2?: string; hex3?: string; className?: string }) {
  const sole = hex2 ?? hex;
  const stroke = isDark(hex) ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';
  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden>
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
      <path d="M58 62 Q102 64 156 44 Q118 64 66 58 Z" fill={hex3 ?? 'transparent'} stroke={hex3 ? 'none' : stroke} strokeWidth="1" strokeDasharray={hex3 ? undefined : '3 3'} />
      <circle cx="30" cy="56" r="4.5" fill={hex3 ?? 'transparent'} stroke={hex3 ? 'none' : stroke} strokeWidth="1" />
      {/* Suela */}
      <path d="M10 70 L192 70 L192 76 Q192 86 178 86 L24 86 Q10 86 10 76 Z" fill={sole} stroke={isDark(sole) ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)'} strokeWidth="1" />
      <line x1="14" y1="78" x2="188" y2="78" stroke={isDark(sole) ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.15)'} strokeWidth="1" />
    </svg>
  );
}

// Descripción corta de los tonos de un color.
export function toneSummary(c: { hex2?: string; hex3?: string }): string {
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
      style={{ background: swatchBackground(value.hex, value.hex2, value.hex3) }}
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
  onClose,
  onSave,
  onRemove,
}: {
  open: boolean;
  value: ColorValue;
  title?: string;
  onClose: () => void;
  onSave: (value: ColorValue) => void;
  onRemove?: () => void;
}) {
  const [hex, setHex] = useState(value.hex);
  const [hex2, setHex2] = useState<string | undefined>(value.hex2);
  const [hex3, setHex3] = useState<string | undefined>(value.hex3);
  const [part, setPart] = useState<'upper' | 'sole' | 'logo'>('upper');
  const [name, setName] = useState(value.name);
  const [nameTouched, setNameTouched] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    setHex(value.hex);
    setHex2(value.hex2);
    setHex3(value.hex3);
    setName(value.name);
    setPart('upper');
    // Si el nombre actual es el sugerido, lo seguimos actualizando solo.
    setNameTouched(value.name.trim() !== '' && value.name !== suggestedName(value.hex, value.hex2, value.hex3));
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
  const effectiveName = nameTouched ? name : suggestedName(hex, hex2, hex3);

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
  const parts = [
    { key: 'upper' as const, label: 'Capellada', color: hex },
    ...(twoTone ? [{ key: 'sole' as const, label: 'Suela', color: hex2! }] : []),
    ...(hasLogo ? [{ key: 'logo' as const, label: 'Logo / detalles', color: hex3! }] : []),
  ];
  const partLabel = part === 'sole' && twoTone ? 'de la suela' : part === 'logo' && hasLogo ? 'del logo / detalles' : 'de la capellada';

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
          <SneakerPreview hex={hex} hex2={hex2} hex3={hex3} className="mx-auto h-28 w-full max-w-[260px]" />
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px]">
            {parts.map((p) => (
              <span key={p.key} className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full ring-1 ring-white/40" style={{ background: p.color }} />
                {p.label}: <strong>{toneName(p.color)}</strong>
              </span>
            ))}
            <span
              className="ml-1 h-5 w-5 rounded-full ring-2 ring-white/20"
              style={{ background: swatchBackground(hex, hex2, hex3) }}
              title="Así se ve la muestra en la tienda"
            />
          </div>
        </div>

        {/* Un color / dos colores */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-cream-alt p-1">
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

        {/* Paleta */}
        <p className="mb-2 mt-4 text-[10px] font-extrabold uppercase tracking-wider text-muted">
          {parts.length > 1 ? `Elige el color ${partLabel}` : 'Elige el color'}
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
              const finalName = effectiveName.trim() || suggestedName(hex, hex2, hex3);
              // Solo se guardan los tonos usados (Firestore no acepta undefined).
              const result: ColorValue = { name: finalName, hex };
              if (twoTone && hex2 && hex2.toLowerCase() !== hex.toLowerCase()) result.hex2 = hex2;
              if (hasLogo && hex3) result.hex3 = hex3;
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
