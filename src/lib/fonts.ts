// Catálogo curado de fuentes de Google Fonts para personalizar la
// tipografía del sitio desde /admin/configuracion. Agrupadas por estilo,
// con opciones que van desde elegante/premium hasta divertidas y juveniles
// (el mismo tipo de fuentes "de moda" que ofrecen Canva o CapCut).
export const FONT_GROUPS: { label: string; fonts: string[] }[] = [
  {
    label: 'Elegante y premium',
    fonts: ['Playfair Display', 'Cormorant Garamond', 'DM Serif Display', 'Marcellus', 'Cinzel'],
  },
  {
    label: 'Moderno y audaz',
    fonts: ['Poppins', 'Montserrat', 'Archivo Black', 'Anton', 'Bebas Neue', 'Oswald'],
  },
  {
    label: 'Divertido y juvenil',
    fonts: ['Fredoka', 'Baloo 2', 'Quicksand', 'Comfortaa', 'Righteous'],
  },
  {
    label: 'Manuscrito / firma',
    fonts: ['Pacifico', 'Dancing Script', 'Caveat', 'Sacramento', 'Great Vibes'],
  },
  {
    label: 'Texto (para párrafos)',
    fonts: ['Inter', 'Nunito', 'Work Sans', 'Mulish', 'Manrope', 'Karla'],
  },
];

export const ALL_CURATED_FONTS = FONT_GROUPS.flatMap((g) => g.fonts);

// Fuentes que solo vienen en un grosor "display" (no tiene sentido pedirle
// al navegador pesos 400/500 que no existen) — se cargan solo en 700/800.
const DISPLAY_ONLY = new Set(['Bebas Neue', 'Anton', 'Righteous', 'Pacifico', 'Dancing Script', 'Caveat', 'Sacramento', 'Great Vibes']);

export function googleFontsHref(families: string[]): string {
  const unique = Array.from(new Set(families.filter(Boolean)));
  const params = unique
    .map((f) => {
      const weights = DISPLAY_ONLY.has(f) ? '400;700' : '400;500;600;700;800';
      // La API de Google Fonts espera los espacios del nombre como "+"
      // (no "%20"), o simplemente no reconoce la fuente pedida.
      const familyParam = encodeURIComponent(f).replace(/%20/g, '+');
      return `family=${familyParam}:wght@${weights}`;
    })
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

// Valor listo para usar en la propiedad CSS font-family (entre comillas,
// con una fuente de respaldo genérica por si la fuente elegida no carga).
export function fontFamilyValue(font: string, fallback: 'serif' | 'sans-serif' = 'sans-serif'): string {
  if (!font) return fallback;
  return `"${font}", ${fallback}`;
}
