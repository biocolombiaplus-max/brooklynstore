// Cargador de imágenes propio para next/image: cada foto se pide ya del
// tamaño justo, sin pasar por el optimizador de Vercel (que en el plan
// gratuito tiene límite mensual y deja las fotos nuevas en blanco).

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  const q = quality || 75;
  // Fotos de la tienda (Firestore): las optimiza /api/img.
  if (src.startsWith('/api/img/')) return `${src.split('?')[0]}?w=${width}&q=${q}`;
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
