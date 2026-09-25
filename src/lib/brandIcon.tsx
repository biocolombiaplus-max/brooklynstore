import type { Branding } from './branding';
import { paddedLogoUrl } from './branding';

// Composición compartida para los íconos de la app (favicon aparte, que se
// queda simple): un marco con degradado de marca de borde a borde y una
// tarjeta redondeada centrada con el logo — así se ve como un ícono de app
// "premium" en vez de un cuadrado plano, y sobrevive los recortes circulares
// o "squircle" que Android aplica a los íconos adaptativos.
export function BrandIconLayout({
  size,
  branding,
  cardRatio = 0.68,
}: {
  size: number;
  branding: Branding;
  cardRatio?: number;
}) {
  const { storeName, logoUrl, primary, primaryHover, cream } = branding;
  const initial = storeName.trim().split(/\s+/).map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase() || 'BS';
  const cardSize = Math.round(size * cardRatio);
  const logoSize = Math.round(cardSize * 0.86);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${primary}, ${primaryHover})`,
      }}
    >
      <div
        style={{
          width: cardSize,
          height: cardSize,
          borderRadius: Math.round(cardSize * 0.24),
          background: cream,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={paddedLogoUrl(logoUrl, logoSize, logoSize, cream)}
            width={logoSize}
            height={logoSize}
            style={{ objectFit: 'contain' }}
            alt=""
          />
        ) : (
          <span style={{ fontSize: Math.round(cardSize * 0.52), fontWeight: 700, color: primary }}>{initial}</span>
        )}
      </div>
    </div>
  );
}
