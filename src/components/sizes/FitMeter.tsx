import { FITS, type Fit } from '@/lib/types';
import { classNames } from '@/lib/utils';

// Medidor visual de horma: pequeña ← normal → grande.
export default function FitMeter({ fit }: { fit: Fit }) {
  const info = FITS.find((f) => f.value === fit) ?? FITS[1];
  const position = { pequena: 0, normal: 1, grande: 2 }[fit] ?? 1;

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-wider text-ink">¿Cómo calza?</p>
        <p className="text-xs font-bold text-primary">{info.label}</p>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className={classNames('h-2 rounded-full', i === position ? 'bg-gold-gradient' : 'bg-border')} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] font-semibold uppercase text-muted">
        <span>Pequeño</span>
        <span>Normal</span>
        <span>Grande</span>
      </div>
      <p className="mt-2 text-xs text-muted">{info.tip}</p>
    </div>
  );
}
