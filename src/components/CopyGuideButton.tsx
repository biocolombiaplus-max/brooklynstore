'use client';

import { useState } from 'react';
import { classNames } from '@/lib/utils';

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = value;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

// Número de guía grande: con un toque se copia para pegarlo en el rastreo.
export default function CopyGuideButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    copyText(value).then((ok) => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }
  return (
    <>
      <button type="button" onClick={copy} className="mt-1 block w-full select-all break-all font-mono text-3xl font-black tracking-wider" aria-label="Copiar número de guía">
        {value}
      </button>
      <button
        type="button"
        onClick={copy}
        className={classNames(
          'mt-3 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider transition-all active:scale-95',
          copied ? 'bg-whatsapp text-white' : 'bg-ink text-white hover:bg-ink/85',
        )}
      >
        {copied ? '✓ Copiada · pégala en Servientrega' : '📋 Copiar número de guía'}
      </button>
    </>
  );
}
