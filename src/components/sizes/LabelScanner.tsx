'use client';

import { useRef, useState } from 'react';
import { prepareLabelImage, readLabel, recommendFromLabel, type LabelRecommendation, type LabelSizes } from '@/lib/labelScan';
import type { SizeGender } from '@/lib/sizes';
import type { Gender } from '@/lib/types';
import { useSiteSettings } from '@/lib/settings-context';
import { classNames, whatsappLinkTo } from '@/lib/utils';
import { WhatsAppIcon } from '../icons';

type Status = 'idle' | 'working' | 'done' | 'error';

function fmt(n: number): string {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

// Escáner de etiqueta: el cliente le toma foto a la etiqueta de un zapato
// que ya usa (lengüeta o por dentro) y le decimos su talla en la tienda.
// En el celular el botón abre directo la cámara trasera.
export default function LabelScanner({
  gender,
  availableSizes,
  onPickSize,
  productTitle,
  compact = false,
}: {
  gender?: Gender;
  availableSizes?: string[];
  onPickSize?: (size: string) => void;
  productTitle?: string;
  compact?: boolean;
}) {
  const { whatsappNumber, whatsappCountryCode } = useSiteSettings();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [stage, setStage] = useState('');
  const [photo, setPhoto] = useState('');
  const [label, setLabel] = useState<LabelSizes | null>(null);
  const [result, setResult] = useState<LabelRecommendation | null>(null);

  const locked = gender === 'hombre' || gender === 'mujer';
  const preferred: SizeGender = gender === 'mujer' ? 'mujer' : 'hombre';

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStatus('working');
    setResult(null);
    setLabel(null);
    setStage('Preparando la foto...');
    try {
      const image = await prepareLabelImage(file);
      setPhoto(image.dataUrl);
      const read = await readLabel(image, setStage);
      setLabel(read);
      const rec = read.readable ? recommendFromLabel(read, preferred, locked) : null;
      setResult(rec);
      setStatus(rec ? 'done' : 'error');
    } catch {
      setStatus('error');
    }
  }

  function reset() {
    setStatus('idle');
    setPhoto('');
    setResult(null);
    setLabel(null);
  }

  const helpMessage = `¡Hola Brooklyn Store! 👋 No estoy seguro de mi talla${productTitle ? ` para las *${productTitle}*` : ''}. Les envío la foto de la etiqueta de mis zapatos 📸 para que me ayuden.`;
  const available = result && (!availableSizes || availableSizes.includes(result.row.ec));
  const readChips = label
    ? [
        label.us !== null && `US ${fmt(label.us)}${label.usGender === 'mujer' ? ' W' : ''}`,
        label.eu !== null && `EUR ${fmt(label.eu)}`,
        label.uk !== null && `UK ${fmt(label.uk)}`,
        label.cm !== null && `${fmt(label.cm)} cm`,
      ].filter(Boolean)
    : [];

  // En la ficha del producto, mientras no se use, es solo una barra fina
  // que abre la cámara de un toque.
  if (compact && status === 'idle') {
    return (
      <>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="group flex w-full items-center gap-3 rounded-2xl bg-[#0a0a0a] px-4 py-3 text-left text-white ring-1 ring-primary/40 transition-transform active:scale-[0.99]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-lg">📸</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-black uppercase tracking-wide">¿No sabes tu talla?</span>
            <span className="block text-[11px] text-white/65">Tómale foto a la etiqueta de tus zapatos y te la decimos</span>
          </span>
          <span className="shrink-0 rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-extrabold uppercase text-primary-light transition-colors group-hover:bg-primary group-hover:text-ink">
            Escanear
          </span>
        </button>
      </>
    );
  }

  return (
    <div
      className={classNames(
        'relative overflow-hidden rounded-2xl bg-[#0a0a0a] text-white ring-1 ring-primary/40',
        compact ? 'p-4' : 'p-5 sm:p-6',
      )}
    >
      <span className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.3),transparent_70%)]" />

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {status === 'idle' && (
        <div className="relative">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-gradient text-xl">📸</span>
            <span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-black uppercase tracking-wide">Escanea tu etiqueta</span>
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-primary-light">
                  Nuevo
                </span>
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-white/65">
                Tómale foto a la etiqueta de unos zapatos que te queden bien y te decimos tu talla exacta en segundos.
              </span>
            </span>
          </div>
          <button type="button" onClick={() => cameraRef.current?.click()} className="btn-primary btn-shine mt-4 w-full py-3.5 text-sm">
            📷 Tomar foto de la etiqueta
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className="mt-2 w-full py-1.5 text-center text-[11px] font-bold text-white/60 underline decoration-white/30 underline-offset-4 hover:text-white"
          >
            o sube una foto de tu galería
          </button>
          {!compact && (
            <p className="mt-3 text-center text-[10px] text-white/45">
              💡 La etiqueta suele estar en la lengüeta o por dentro, en el costado. Buena luz y que se lean los números.
            </p>
          )}
        </div>
      )}

      {status === 'working' && (
        <div className="relative flex items-center gap-4">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl ring-2 ring-primary/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo && <img src={photo} alt="Etiqueta" className="h-full w-full object-cover" />}
            <span className="absolute inset-x-0 h-0.5 animate-scan bg-primary-light shadow-[0_0_12px_3px_rgba(212,175,55,0.8)]" />
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-primary-light">Escaneando...</p>
            <p className="mt-1 text-xs text-white/70">{stage}</p>
            <div className="mt-3 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-pulseSoft rounded-full bg-primary-light" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {status === 'done' && result && (
        <div className="relative animate-slideUp">
          <div className="flex items-center gap-4">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="Etiqueta" className="h-20 w-20 shrink-0 rounded-xl object-cover ring-2 ring-primary/60" />
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/50">Leímos tu etiqueta</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {readChips.map((chip) => (
                  <span key={String(chip)} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold ring-1 ring-white/15">
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white/[0.06] p-4 text-center ring-1 ring-primary/30">
            <p className="text-xs text-white/70">Tu talla Brooklyn {result.gender === 'mujer' ? 'de mujer' : 'de hombre'} es</p>
            <p className="mt-1 text-5xl font-black leading-none text-gold-gradient animate-popIn">{result.row.ec}</p>
            <p className="mt-2 text-sm font-bold text-white/85">
              US {result.row.us} · pie de {fmt(result.row.cm)} cm
            </p>
          </div>

          {onPickSize && available && (
            <button type="button" onClick={() => onPickSize(result.row.ec)} className="btn-primary btn-shine mt-3 w-full py-3.5 text-sm">
              ✓ Elegir talla {result.row.ec}
            </button>
          )}
          {availableSizes && !available && (
            <p className="mt-3 rounded-xl bg-white/10 p-3 text-center text-xs text-white/80">
              La talla {result.row.ec} no está disponible en este modelo ahora. Escríbenos y te ayudamos a encontrar otro.
            </p>
          )}
          <p className="mt-3 text-center text-[10px] leading-relaxed text-white/45">
            Cada marca calza un poquito distinto: si vas entre dos tallas, elige la mayor. ¿Dudas? Te asesoramos por WhatsApp.
          </p>
          <button type="button" onClick={reset} className="mt-2 w-full py-1 text-center text-[11px] font-bold text-white/60 underline underline-offset-4">
            Escanear otra etiqueta
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="relative animate-slideUp">
          <p className="text-sm font-black uppercase tracking-wide text-primary-light">No pudimos leer bien la etiqueta 😕</p>
          <ul className="mt-2 space-y-1 text-xs text-white/70">
            <li>• Acércate para que la etiqueta llene la foto.</li>
            <li>• Usa buena luz y evita reflejos o sombras.</li>
            <li>• Asegúrate de que se vean los números US, EUR o CM.</li>
          </ul>
          <button type="button" onClick={() => cameraRef.current?.click()} className="btn-primary mt-4 w-full py-3 text-sm">
            📷 Intentar de nuevo
          </button>
          <a
            href={whatsappLinkTo(whatsappNumber, helpMessage, whatsappCountryCode)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp mt-2 w-full py-3 text-sm"
          >
            <WhatsAppIcon /> Mándanos la foto y te ayudamos
          </a>
          <button type="button" onClick={reset} className="mt-2 w-full py-1 text-center text-[11px] font-bold text-white/50 underline underline-offset-4">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
