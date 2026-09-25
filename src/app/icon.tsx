import { ImageResponse } from 'next/og';
import { getBranding, paddedLogoUrl } from '@/lib/branding';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default async function Icon() {
  const { storeName, logoUrl, primary, cream } = await getBranding();
  const initial = storeName.trim().split(/\s+/).map((w) => w.charAt(0)).join('').slice(0, 2).toUpperCase() || 'BS';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: logoUrl ? cream : primary,
          borderRadius: 14,
        }}
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={paddedLogoUrl(logoUrl, size.width, size.height, cream)}
            width={size.width}
            height={size.height}
            style={{ objectFit: 'contain' }}
            alt=""
          />
        ) : (
          <span style={{ fontSize: 36, fontWeight: 700, color: cream }}>{initial}</span>
        )}
      </div>
    ),
    { ...size },
  );
}
