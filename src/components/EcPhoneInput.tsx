'use client';

import { forwardRef } from 'react';
import { classNames } from '@/lib/utils';
import { ecNational, formatEcNational } from '@/lib/phone';

// Campo de WhatsApp con el prefijo de Ecuador ya puesto (🇪🇨 +593): el
// cliente solo escribe los 9 dígitos. Acepta que pegue el número con 0, con
// +593 o con espacios. `value` son los 9 dígitos nacionales.
const EcPhoneInput = forwardRef<HTMLInputElement, { value: string; onChange: (national: string) => void; invalid?: boolean; autoFocus?: boolean }>(
  function EcPhoneInput({ value, onChange, invalid = false, autoFocus = false }, ref) {
    return (
      <div
        className={classNames(
          'flex items-stretch overflow-hidden rounded-xl border-2 bg-white transition-all focus-within:border-buy focus-within:ring-4 focus-within:ring-buy/15',
          invalid ? 'border-urgent ring-2 ring-urgent/20' : 'border-ink/15',
        )}
      >
        <span className="flex shrink-0 items-center gap-1.5 border-r-2 border-ink/10 bg-cream-alt/70 px-3 text-base font-extrabold text-ink">
          <span aria-hidden>🇪🇨</span> +593
        </span>
        <input
          ref={ref}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          enterKeyHint="send"
          placeholder="99 123 4567"
          aria-label="Tu número de WhatsApp"
          value={formatEcNational(value)}
          onChange={(e) => onChange(ecNational(e.target.value))}
          className="min-w-0 flex-1 bg-transparent px-3 py-3.5 text-lg font-bold tracking-wide text-ink placeholder:font-normal placeholder:text-muted/50 focus:outline-none"
        />
      </div>
    );
  },
);

export default EcPhoneInput;
