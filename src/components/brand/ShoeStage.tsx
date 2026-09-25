import { classNames } from '@/lib/utils';
import SafeImage from '../SafeImage';

// "Escenario" para mostrar el zapato recortado: foco de luz detrás, sombra
// de contacto realista en el piso y el zapato flotando suavemente.
export default function ShoeStage({
  src,
  alt,
  sizes = '50vw',
  className,
  float = true,
  tilt = true,
  glow = true,
}: {
  src: string;
  alt: string;
  sizes?: string;
  className?: string;
  float?: boolean;
  tilt?: boolean;
  glow?: boolean;
}) {
  return (
    <div className={classNames('group/stage relative', className)}>
      {glow && (
        <>
          <div className="pointer-events-none absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,rgba(233,213,154,0.35),rgba(184,146,58,0.12)_55%,transparent)]" />
          <div className="pointer-events-none absolute inset-x-[18%] top-[18%] h-[45%] rounded-full bg-white/10 blur-3xl" />
        </>
      )}
      {/* Sombra de contacto: se achica cuando el zapato "sube" */}
      <div
        className={classNames(
          'pointer-events-none absolute inset-x-[14%] bottom-[7%] h-[9%] rounded-[50%] bg-black/80 blur-xl',
          float && 'animate-[shadowPulse_4s_ease-in-out_infinite]',
        )}
      />
      <div className={classNames('absolute inset-0', float && 'animate-[stageFloat_4s_ease-in-out_infinite]')}>
        <SafeImage
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={classNames(
            'object-contain transition-transform duration-700 [filter:drop-shadow(0_18px_22px_rgba(0,0,0,0.45))]',
            tilt && '-rotate-[8deg] group-hover/stage:-rotate-[4deg] group-hover/stage:scale-[1.04]',
          )}
        />
      </div>
    </div>
  );
}
