// Cargador de imágenes propio para next/image: cada foto se pide ya del
// tamaño justo, sin pasar por el optimizador de Vercel (que en el plan
// gratuito tiene límite mensual y deja las fotos nuevas en blanco).

// Pocos tamaños fijos: así todos los celulares piden las mismas URLs y la
// CDN las entrega ya listas (sin volver a generarlas).
const STORE_WIDTHS = [128, 256, 384, 640, 828, 1080, 1600];

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  const q = quality || 70;
  // Fotos de la tienda (Firestore): las optimiza /api/img.
  if (src.startsWith('/api/img/')) {
    const w = STORE_WIDTHS.find((s) => s >= width) ?? STORE_WIDTHS[STORE_WIDTHS.length - 1];
    return `${src.split('?')[0]}?w=${w}&q=${q}`;
  }
  // Cloudinary: transformación en su CDN.
  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) return src.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
  // Unsplash: tamaño por parámetros.
  if (src.includes('images.unsplash.com')) {
    try {
      const u = new URL(src);
      u.searchParams.set('w', String(width));
      u.searchParams.set('q', String(q));
      u.searchParams.set('auto', 'format');
      return u.toString();
    } catch {
      return src;
    }
  }
  // Archivos locales (logos, SVG) y otros servicios: tal cual.
  return src;
}
