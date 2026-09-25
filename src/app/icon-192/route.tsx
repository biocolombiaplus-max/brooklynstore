import { ImageResponse } from 'next/og';
import { getBranding } from '@/lib/branding';
import { BrandIconLayout } from '@/lib/brandIcon';

const SIZE = 192;

export async function GET() {
  const branding = await getBranding();
  return new ImageResponse(<BrandIconLayout size={SIZE} branding={branding} />, { width: SIZE, height: SIZE });
}
