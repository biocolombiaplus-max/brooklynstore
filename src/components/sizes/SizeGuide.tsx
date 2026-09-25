'use client';

import { useMemo, useState } from 'react';
import { ADULT_SIZES, KID_SIZES, recommendSize } from '@/lib/sizes';
import { FITS, type Fit } from '@/lib/types';
import { classNames } from '@/lib/utils';
import FootMeasureIllustration from './FootMeasureIllustration';

// Guía de tallas completa: calculadora por centímetros, cómo medir el pie y
// tabla de equivalencias EC / EU / US. Se usa dentro de la ficha del
// producto (en una ventana) y en la página /guia-de-tallas.
export default function SizeGuide({
  fit = 'normal',
  kids = false,
  availableSizes,
  onPickSize,
}: {
  fit?: Fit;
  kids?: boolean;
  availableSizes?: string[];
  onPickSize?: (size: string) => void;
}) {
  const [tab, setTab] = useState<'adultos' | 'ninos'>(kids ? 'ninos' : 'adultos');
  const [cmInput, setCmInput] = useState('');
  const footCm = Number(cmInput.replace(',', '.'));
  const fitInfo = FITS.find((f) => f.value === fit) ?? FITS[1];

  const table = tab === 'adultos' ? ADULT_SIZES : KID_SIZES;
  const recommended = useMemo(() => recommendSize<{ ec: string; eu: string; cm: number }>(table, footCm, fit), [table, footCm, fit]);
  const recommendedAvailable = !availableSizes || (recommended && availableSizes.includes(recommended.ec));

  return (
    <div className="space-y-6">
      <div className="flex rounded-full bg-cream-alt p-1">
        {(['adultos', 'ninos'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={classNames(
              'flex-1 rounded-full py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all',
              tab === t ? 'bg-ink text-white shadow-dark' : 'text-muted',
            )}
          >
            {t === 'adultos' ? 'Hombre / Mujer' : 'Niños'}
          </button>
        ))}
      </div>

      {/* Calculadora */}
      <div className="rounded-2xl bg-ink p-5 text-white sm:p-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary-light">Calculadora de talla</p>
        <p className="mt-1 text-sm text-white/80">Escribe el largo de tu pie en centímetros y te decimos tu talla exacta:</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1">
            <input
              inputMode="decimal"
              value={cmInput}
              onChange={(e) => setCmInput(e.target.value.replace(/[^0-9.,]/g, ''))}
              placeholder={tab === 'adultos' ? 'Ej: 25,5' : 'Ej: 17'}
              className="w-full rounded-xl border-2 border-white/20 bg-white/10 px-4 py-3.5 pr-12 text-lg font-bold text-white placeholder:text-white/40 focus:border-primary-light focus:outline-none"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-white/60">cm</span>
          </div>
        </div>

        {cmInput && (
          <div className="mt-4 animate-slideUp rounded-xl bg-white/10 p-4">
            {recommended ? (
              <>
                <p className="text-sm text-white/80">Tu talla recomendada es:</p>
                <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
                  <span className="text-4xl font-black text-gold-gradient">EC {recommended.ec}</span>
                  <span className="text-xs text-white/70">(EU {recommended.eu})</span>
                </p>
                {fit !== 'normal' && <p className="mt-2 text-xs text-primary-light">👟 Este modelo es de {fitInfo.label.toLowerCase()}: ya lo tuvimos en cuenta.</p>}
                {onPickSize && recommendedAvailable && (
                  <button onClick={() => onPickSize(recommended.ec)} className="btn-primary mt-4 w-full py-3 text-xs">
                    ✓ Elegir talla {recommended.ec}
                  </button>
                )}
                {onPickSize && !recommendedAvailable && (
                  <p className="mt-3 text-xs text-white/80">
                    Esa talla no está disponible en este modelo por ahora. Escríbenos por WhatsApp y te avisamos cuando llegue.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-white/80">
                {footCm > 0 ? 'Esa medida está fuera de nuestra tabla. Escríbenos por WhatsApp y te asesoramos.' : 'Escribe una medida válida.'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Cómo medir */}
      <div className="grid items-center gap-5 rounded-2xl border border-border p-5 sm:grid-cols-[140px_1fr] sm:p-6">
        <FootMeasureIllustration className="mx-auto h-44 w-auto sm:h-40" />
        <div>
          <p className="text-sm font-black uppercase text-ink">¿Cómo medir tu pie? 📏</p>
          <ol className="mt-3 space-y-2 text-sm text-muted">
            <li><strong className="text-ink">1.</strong> Pon una hoja en el piso, pegada a la pared.</li>
            <li><strong className="text-ink">2.</strong> Párate encima con el talón tocando la pared (con la media que usarás).</li>
            <li><strong className="text-ink">3.</strong> Marca con un lápiz la punta de tu dedo más largo.</li>
            <li><strong className="text-ink">4.</strong> Mide con una regla desde el borde hasta la marca. ¡Esa es tu medida!</li>
          </ol>
          <p className="mt-3 text-xs text-muted">Tip: mide los dos pies en la tarde (el pie se hincha un poquito) y usa la medida mayor.</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-2xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-center text-sm">
            <thead className="bg-cream-alt text-[11px] uppercase tracking-wider text-ink">
              {tab === 'adultos' ? (
                <tr>
                  <th className="px-3 py-3 font-extrabold">Talla EC</th>
                  <th className="px-3 py-3 font-extrabold">Pie (cm)</th>
                  <th className="px-3 py-3 font-extrabold">EU</th>
                  <th className="px-3 py-3 font-extrabold">US Hombre</th>
                  <th className="px-3 py-3 font-extrabold">US Mujer</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-3 py-3 font-extrabold">Talla EC</th>
                  <th className="px-3 py-3 font-extrabold">Pie (cm)</th>
                  <th className="px-3 py-3 font-extrabold">EU</th>
                  <th className="px-3 py-3 font-extrabold">US</th>
                  <th className="px-3 py-3 font-extrabold">Edad aprox.</th>
                </tr>
              )}
            </thead>
            <tbody>
              {tab === 'adultos'
                ? ADULT_SIZES.map((row) => (
                    <tr
                      key={row.ec}
                      className={classNames(
                        'border-t border-border transition-colors',
                        recommended?.ec === row.ec ? 'bg-gold-100 font-extrabold' : 'hover:bg-cream-alt/60',
                        availableSizes && !availableSizes.includes(row.ec) && 'text-muted/60',
                      )}
                    >
                      <td className="px-3 py-2.5 font-black text-ink">{row.ec}</td>
                      <td className="px-3 py-2.5">{row.cm.toFixed(1)}</td>
                      <td className="px-3 py-2.5">{row.eu}</td>
                      <td className="px-3 py-2.5">{row.usM}</td>
                      <td className="px-3 py-2.5">{row.usW}</td>
                    </tr>
                  ))
                : KID_SIZES.map((row) => (
                    <tr
                      key={row.ec}
                      className={classNames(
                        'border-t border-border',
                        recommended?.ec === row.ec ? 'bg-gold-100 font-extrabold' : 'hover:bg-cream-alt/60',
                      )}
                    >
                      <td className="px-3 py-2.5 font-black text-ink">{row.ec}</td>
                      <td className="px-3 py-2.5">{row.cm.toFixed(1)}</td>
                      <td className="px-3 py-2.5">{row.eu}</td>
                      <td className="px-3 py-2.5">{row.us}</td>
                      <td className="px-3 py-2.5 text-muted">{row.age}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        <p className="rounded-2xl bg-cream-alt p-4 text-muted">
          <strong className="text-ink">¿Entre dos tallas?</strong> Elige la mayor. Si tienes el pie ancho o el empeine alto, también sube
          media talla.
        </p>
        <p className="rounded-2xl bg-cream-alt p-4 text-muted">
          <strong className="text-ink">¿No te quedó?</strong> Tranqui: tienes 7 días para cambiar la talla, con el zapato sin uso y en su
          caja.
        </p>
      </div>
    </div>
  );
}
