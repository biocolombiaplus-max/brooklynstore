import { ImageResponse } from 'next/og';
import { getBranding } from '@/lib/branding';
import { BrandIconLayout } from '@/lib/brandIcon';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const branding = await getBranding();
  return new ImageResponse(<BrandIconLayout size={size.width} branding={branding} />, { ...size });
}
