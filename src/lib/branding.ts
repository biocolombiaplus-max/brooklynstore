import { FIREBASE_CONFIG } from './firebase-config';

// Estos archivos (icon.tsx, apple-icon.tsx, opengraph-image.tsx) se generan
// en el servidor y no pueden usar el SDK de cliente de Firebase (src/lib/
// firebase.ts está deliberadamente deshabilitado fuera del navegador). En
// vez de eso, leen el documento público de configuración directamente vía
// la API REST de Firestore (la regla de seguridad ya permite lectura
// pública de "settings"), con una caída segura a los valores por defecto
// si algo falla.

export interface Branding {
  storeName: string;
  logoUrl: string;
  primary: string;
  primaryHover: string;
  cream: string;
  ink: string;
}

const DEFAULTS: Branding = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || 'Brooklyn Store',
  logoUrl: '',
  primary: '#B8923A',
  primaryHover: '#96742A',
  cream: '#FFFFFF',
  ink: '#0E0E0E',
};

export async function getBranding(): Promise<Branding> {
  const projectId = FIREBASE_CONFIG.projectId;
  if (!projectId) return DEFAULTS;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/site`,
      { signal: controller.signal, next: { revalidate: 3600 } },
    );
    clearTimeout(timeout);
    if (!res.ok) return DEFAULTS;

    const data = await res.json();
    const fields = data?.fields ?? {};
    const colorFields = fields.colors?.mapValue?.fields ?? {};

    return {
      storeName: fields.storeName?.stringValue || DEFAULTS.storeName,
      // Solo logos subidos a Cloudinary (URL absoluta) sirven para generar los
      // íconos en el servidor; el logo incluido en /public se reemplaza por el
      // monograma "BS".
      logoUrl: /^https?:\/\//.test(fields.logoUrl?.stringValue ?? '') ? fields.logoUrl.stringValue : '',
      primary: colorFields.primary?.stringValue || DEFAULTS.primary,
      primaryHover: colorFields.primaryHover?.stringValue || DEFAULTS.primaryHover,
      cream: colorFields.cream?.stringValue || DEFAULTS.cream,
      ink: colorFields.ink?.stringValue || DEFAULTS.ink,
    };
  } catch {
    return DEFAULTS;
  }
}

// Inserta una transformación de Cloudinary para centrar el logo (con su
// proporción original intacta) sobre un lienzo cuadrado o rectangular del
// tamaño exacto que necesita cada ícono, en vez de recortarlo.
export function paddedLogoUrl(url: string, width: number, height: number, bgHex: string): string {
  if (!url.includes('/image/upload/')) return url;
  const bg = bgHex.replace('#', '');
  const transform = `c_pad,b_rgb:${bg},w_${width},h_${height},q_auto,f_png`;
  return url.replace('/image/upload/', `/image/upload/${transform}/`);
}
