// Trae la configuración del sitio ANTES de renderizar la página (en el
// servidor), para que el HTML que le llega a la clienta ya traiga el logo
// y la foto del hero correctos desde el primer instante — así el navegador
// empieza a descargar esas imágenes de inmediato, en paralelo con el
// JavaScript, en vez de esperar a que la página cargue y LUEGO consultar
// la base de datos desde el navegador (ese doble viaje era el causante del
// "salto"/demora al entrar por primera vez). Usa la misma API REST pública
// de Firestore que src/lib/branding.ts, porque el SDK de cliente de
// Firebase está deliberadamente deshabilitado fuera del navegador.
import { FIREBASE_CONFIG } from '@/lib/firebase-config';
import { DEFAULT_SETTINGS, mergeWithDefaults } from './settings';
import type { SiteSettings } from './types';

function unwrapValue(value: any): any {
  if (value == null) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('mapValue' in value) return unwrapFields(value.mapValue.fields ?? {});
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(unwrapValue);
  return null;
}

function unwrapFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) result[key] = unwrapValue(value);
  return result;
}

export async function getSiteSettingsServer(): Promise<SiteSettings> {
  const projectId = FIREBASE_CONFIG.projectId;
  if (!projectId) return DEFAULT_SETTINGS;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/site`,
      { signal: controller.signal, next: { revalidate: 60 } },
    );
    clearTimeout(timeout);
    if (!res.ok) return DEFAULT_SETTINGS;

    const data = await res.json();
    return mergeWithDefaults(unwrapFields(data.fields ?? {}) as Partial<SiteSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}
