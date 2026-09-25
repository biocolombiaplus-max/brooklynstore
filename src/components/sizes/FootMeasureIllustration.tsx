// Dibujo simple de cómo medir el pie: hoja en el piso contra la pared, pie
// encima y la línea desde el talón hasta el dedo más largo.
export default function FootMeasureIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 260" className={className} role="img" aria-label="Cómo medir tu pie">
      <rect x="0" y="0" width="220" height="16" fill="#0E0E0E" opacity="0.85" />
      <text x="110" y="12" textAnchor="middle" fontSize="9" fontWeight="700" fill="#D9BE72" letterSpacing="2">
        PARED
      </text>
      <rect x="40" y="16" width="140" height="230" rx="4" fill="#FFFFFF" stroke="#E7E1D4" strokeWidth="2" />
      <path
        d="M110 30c-22 0-34 20-34 48 0 22 6 36 8 58 2 24-8 44-8 66 0 20 14 32 34 32s34-12 34-32c0-24-8-40-6-64 2-24 8-38 8-60 0-28-14-48-36-48Z"
        fill="#F4EACB"
        stroke="#B8923A"
        strokeWidth="2"
      />
      <circle cx="98" cy="40" r="7" fill="#E9D59A" stroke="#B8923A" />
      <line x1="196" y1="20" x2="196" y2="234" stroke="#E2472D" strokeWidth="2.5" markerStart="url(#a)" markerEnd="url(#a)" />
      <line x1="120" y1="20" x2="200" y2="20" stroke="#E2472D" strokeDasharray="4 3" />
      <line x1="140" y1="234" x2="200" y2="234" stroke="#E2472D" strokeDasharray="4 3" />
      <text x="206" y="130" fontSize="11" fontWeight="800" fill="#E2472D" transform="rotate(90 206 130)" textAnchor="middle">
        LARGO (cm)
      </text>
      <defs>
        <marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0L10 5L0 10z" fill="#E2472D" />
        </marker>
      </defs>
    </svg>
  );
}
