import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';
import { FIREBASE_CONFIG } from './firebase-config';

const firebaseConfig: FirebaseOptions = FIREBASE_CONFIG;

// Todas las páginas que usan Firebase son componentes de cliente que piden
// sus datos dentro de useEffect (nunca durante el render inicial), y ese
// render inicial también corre una vez en el servidor antes de hidratar. Por
// eso estas instancias solo se crean en el navegador (en el servidor quedan
// como `undefined`, lo cual es seguro porque nunca se usan ahí).
//
// Además, mientras no exista un proyecto de Firebase configurado (variables
// NEXT_PUBLIC_FIREBASE_* vacías o inválidas), la inicialización puede lanzar
// un error de forma síncrona apenas se importa este archivo — eso tumbaría
// toda la app en el navegador. Por eso cada paso va envuelto en try/catch:
// si falla, solo queda `undefined` y cada pantalla lo maneja mostrando un
// catálogo vacío en vez de romper toda la página.
const isBrowser = typeof window !== 'undefined';

// Sin proyecto de Firebase configurado la tienda igual funciona: muestra el
// catálogo de demostración (ver demo-products.ts) y los pedidos se confirman
// directamente por WhatsApp sin guardarse en la base de datos.
export const isFirebaseConfigured = !!firebaseConfig.projectId && !!firebaseConfig.apiKey;

function safeInit<T>(factory: () => T, label: string): T | undefined {
  if (!isBrowser || !isFirebaseConfigured) return undefined;
  try {
    return factory();
  } catch (error) {
    console.error(
      `[Firebase] No se pudo inicializar "${label}". Verifica las variables NEXT_PUBLIC_FIREBASE_* en tu proyecto de Vercel/`.concat(
        '.env.local (ver README.md).',
      ),
      error,
    );
    return undefined;
  }
}

const app = safeInit(() => (getApps().length ? getApp() : initializeApp(firebaseConfig)), 'app');

export const firebaseApp = app as FirebaseApp;
export const db = (app ? safeInit(() => getFirestore(app), 'firestore') : undefined) as Firestore;
export const storage = (app ? safeInit(() => getStorage(app), 'storage') : undefined) as FirebaseStorage;
export const auth = (app ? safeInit(() => getAuth(app), 'auth') : undefined) as Auth;
