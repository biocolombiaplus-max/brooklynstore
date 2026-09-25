// Íconos SVG en línea (sin librerías extra) usados en toda la tienda.
type IconProps = { className?: string; size?: number };

export function WhatsAppIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.87.5 3.63 1.44 5.15L2 22l5.09-1.53a9.87 9.87 0 0 0 4.95 1.34h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.83 14.02c-.24.68-1.4 1.3-1.93 1.35-.5.05-1 .25-3.42-.72-2.9-1.16-4.75-4.13-4.9-4.32-.14-.19-1.17-1.56-1.17-2.98 0-1.42.74-2.11 1-2.4.26-.29.58-.36.77-.36s.38 0 .55.01c.18.01.41-.07.64.49.24.58.81 2 .88 2.14.07.14.11.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.06.94 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.55.73 1.81.87.26.14.44.2.5.32.06.12.06.68-.18 1.36Z" />
    </svg>
  );
}

export function CartIcon({ className, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M5 7h14l-1.2 12.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 7Z" strokeLinejoin="round" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIcon({ className, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

export function MenuIcon({ className, size = 22, open = false }: IconProps & { open?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      {open ? <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /> : <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />}
    </svg>
  );
}

export function ChevronIcon({ className, size = 14, dir = 'down' }: IconProps & { dir?: 'down' | 'right' | 'left' | 'up' }) {
  const rotate = { down: 0, right: -90, left: 90, up: 180 }[dir];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className} style={{ transform: `rotate(${rotate}deg)` }} aria-hidden>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function RulerIcon({ className, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="2" y="7" width="20" height="10" rx="1.5" />
      <path d="M6 7v4M10 7v3M14 7v4M18 7v3" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ className, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={className} aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className, size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function StarRow({ rating = 5, className }: { rating?: number; className?: string }) {
  return (
    <span className={className} aria-label={`${rating} de 5 estrellas`}>
      <span className="text-primary">{'★'.repeat(Math.round(rating))}</span>
      <span className="text-border">{'★'.repeat(5 - Math.round(rating))}</span>
    </span>
  );
}
