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

function suggestedName(hex: string, hex2?: string): string {
  const a = toneName(hex);
  if (!hex2) return a;
  const b = toneName(hex2);
  return a === b ? a : `${a} / ${b}`;
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
      style={{ background: swatchBackground(value.hex, value.hex2) }}
    >
      <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[8px] text-white opacity-90 group-hover:opacity-100">
        ✎
      </span>
    </button>
  );
}

/**
 * Editor de color de un zapato: un tono o dos tonos (capellada + suela),
 * paleta con nombres, color personalizado y nombre sugerido automáticamente.
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
  const [part, setPart] = useState<'upper' | 'sole'>('upper');
  const [name, setName] = useState(value.name);
  const [nameTouched, setNameTouched] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    setHex(value.hex);
    setHex2(value.hex2);
    setName(value.name);
    setPart('upper');
    // Si el nombre actual es el sugerido, lo seguimos actualizando solo.
    setNameTouched(value.name.trim() !== '' && value.name !== suggestedName(value.hex, value.hex2));
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, value, onClose]);

  const twoTone = hex2 !== undefined;
  const effectiveName = nameTouched ? name : suggestedName(hex, hex2);

  function pick(color: string) {
    if (twoTone && part === 'sole') setHex2(color);
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

  const activeHex = twoTone && part === 'sole' ? hex2! : hex;

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
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-[#0a0a0a] p-4 text-white">
          <span
            className="h-16 w-16 shrink-0 rounded-full ring-4 ring-white/15"
            style={{ background: swatchBackground(hex, hex2) }}
          />
          <div className="min-w-0 text-xs">
            <p className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full ring-1 ring-white/40" style={{ background: hex }} /> Capellada:{' '}
              <strong>{toneName(hex)}</strong>
            </p>
            {twoTone && (
              <p className="mt-1 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full ring-1 ring-white/40" style={{ background: hex2 }} /> Suela / detalles:{' '}
                <strong>{toneName(hex2!)}</strong>
              </p>
            )}
            <p className="mt-1 text-white/50">Así se ve en la tienda</p>
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

        {twoTone && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { key: 'upper' as const, label: 'Capellada', color: hex },
              { key: 'sole' as const, label: 'Suela / detalles', color: hex2! },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPart(p.key)}
                className={classNames(
                  'flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold ring-2 transition-colors',
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
          {twoTone ? `Elige el color de ${part === 'upper' ? 'la capellada' : 'la suela / detalles'}` : 'Elige el color'}
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
              const finalName = effectiveName.trim() || suggestedName(hex, hex2);
              // Sin "hex2" cuando es de un solo tono (Firestore no acepta undefined).
              onSave(twoTone && hex2 && hex2.toLowerCase() !== hex.toLowerCase() ? { name: finalName, hex, hex2 } : { name: finalName, hex });
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
