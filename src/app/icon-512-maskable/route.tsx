import { ImageResponse } from 'next/og';
import { getBranding } from '@/lib/branding';
import { BrandIconLayout } from '@/lib/brandIcon';

const SIZE = 512;

// Versión "maskable": Android puede recortar el ícono en círculo, cuadrado
// redondeado u otras formas — se deja más margen alrededor de la tarjeta
// para que el logo nunca quede cortado, sin importar la forma que use el
// launcher del teléfono.
export async function GET() {
  const branding = await getBranding();
  return new ImageResponse(<BrandIconLayout size={SIZE} branding={branding} cardRatio={0.52} />, {
    width: SIZE,
    height: SIZE,
  });
}
