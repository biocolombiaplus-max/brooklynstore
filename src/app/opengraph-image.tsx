import { ImageResponse } from 'next/og';
import { getBranding, paddedLogoUrl } from '@/lib/branding';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const BADGES = ['✅ 100% originales', '💵 Contra entrega', '🚚 Envío a todo Ecuador'];

function siteDomain(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore.ec';
  return raw.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export default async function OgImage() {
  const { storeName, logoUrl, primary, primaryHover, ink, cream } = await getBranding();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: `linear-gradient(135deg, ${primary} 0%, ${primaryHover} 55%, ${ink} 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* Manchas decorativas translúcidas — le dan profundidad al fondo */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            left: -140,
            width: 480,
            height: 480,
            borderRadius: 480,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -220,
            right: -160,
            width: 560,
            height: 560,
            borderRadius: 560,
            background: 'rgba(255,255,255,0.06)',
            display: 'flex',
          }}
        />

        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Tarjeta elevada con el logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: cream,
              borderRadius: 36,
              border: '3px solid rgba(255,255,255,0.5)',
              padding: logoUrl ? '38px 64px' : '48px 72px',
            }}
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={paddedLogoUrl(logoUrl, 480, 180, cream)}
                width={480}
                height={180}
                style={{ objectFit: 'contain' }}
                alt=""
              />
            ) : (
              <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, color: primary }}>{storeName}</div>
            )}
          </div>

          <div style={{ display: 'flex', marginTop: 34, fontSize: 30, fontWeight: 600, color: cream }}>
            Zapatos originales multimarca · Envío a todo Ecuador
          </div>

          <div style={{ display: 'flex', marginTop: 36, gap: 16 }}>
            {BADGES.map((label) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  padding: '13px 24px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  color: cream,
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', marginTop: 42, fontSize: 22, letterSpacing: 2, color: 'rgba(255,255,255,0.6)' }}>
            {siteDomain().toUpperCase()}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
