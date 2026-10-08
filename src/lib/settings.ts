import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { refreshStore } from './storeRefresh';
import type { SiteSettings } from './types';

const DOC_PATH = { collection: 'settings', id: 'site' } as const;

export { DEFAULT_SETTINGS, mergeWithDefaults } from './settingsDefaults';
import { DEFAULT_SETTINGS, mergeWithDefaults } from './settingsDefaults';

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!db) return DEFAULT_SETTINGS;
  try {
    const ref = doc(db, DOC_PATH.collection, DOC_PATH.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_SETTINGS;
    return mergeWithDefaults(snap.data() as Partial<SiteSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Guarda solo algunos campos (sin tocar el resto de la configuración).
export async function updateSiteSettingsFields(fields: Partial<SiteSettings>): Promise<void> {
  await setDoc(doc(db, DOC_PATH.collection, DOC_PATH.id), fields, { merge: true });
  refreshStore();
}

export async function updateSiteSettings(settings: SiteSettings): Promise<void> {
  const ref = doc(db, DOC_PATH.collection, DOC_PATH.id);
  await setDoc(ref, settings, { merge: true });
  refreshStore();
}

// Agrega una marca nueva a la lista de la tienda (menú, cinta de marcas y
// filtros) la primera vez que se guarda un producto con ella.
export async function registerBrand(brand: string): Promise<void> {
  const name = brand.trim();
  if (!name || !db) return;
  const current = await getSiteSettings();
  if (current.brands.some((b) => b.trim().toLowerCase() === name.toLowerCase())) return;
  await setDoc(doc(db, DOC_PATH.collection, DOC_PATH.id), { brands: [...current.brands, name] }, { merge: true });
  refreshStore();
}
