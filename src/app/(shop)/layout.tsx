import SiteChrome from '@/components/SiteChrome';
import { getSiteSettingsServer } from '@/lib/settingsServer';
import { googleFontsHref } from '@/lib/fonts';

// Las páginas de la tienda dependen de datos en vivo de Firestore (productos,
// carrito, pedidos), así que se renderizan siempre en el momento de la
// solicitud en lugar de generarse como HTML estático en el build.
export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettingsServer();

  return (
    <>
      {/* El logo, la foto del hero y la tipografía ya llegan resueltos en
          este mismo HTML — así el navegador empieza a descargarlos de una
          vez, sin esperar a un viaje extra a la base de datos desde el
          cliente antes de saber qué imagen mostrar. */}
      <link rel="stylesheet" href={googleFontsHref([settings.fonts.headingFont, settings.fonts.bodyFont, 'Playfair Display'])} />
      <SiteChrome initialSettings={settings}>{children}</SiteChrome>
    </>
  );
}
