'use client';

import { useEffect } from 'react';
import type { Fit, Gender } from '@/lib/types';
import { CloseIcon } from '../icons';
import SizeGuide from './SizeGuide';

export default function SizeGuideModal({
  open,
  onClose,
  fit,
  gender,
  availableSizes,
  onPickSize,
  productTitle,
}: {
  open: boolean;
  onClose: () => void;
  fit?: Fit;
  gender?: Gender;
  availableSizes?: string[];
  onPickSize?: (size: string) => void;
  productTitle?: string;
}) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/70 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-2xl animate-slideUp overflow-y-auto rounded-t-3xl bg-white p-5 shadow-dark sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Guía de tallas"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="section-eyebrow">Guía de tallas</p>
            <h2 className="mt-1 text-xl font-black uppercase text-ink sm:text-2xl">Encuentra tu talla perfecta</h2>
            {productTitle && <p className="mt-1 text-xs text-muted">Para: {productTitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-alt">
            <CloseIcon />
          </button>
        </div>
        <SizeGuide
          fit={fit}
          gender={gender}
          availableSizes={availableSizes}
          onPickSize={
            onPickSize
              ? (s) => {
                  onPickSize(s);
                  onClose();
                }
              : undefined
          }
        />
      </div>
    </div>
  );
}
