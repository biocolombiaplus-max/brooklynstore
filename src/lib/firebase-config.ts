// Configuración web del proyecto de Firebase de Brooklyn Store
// (brooklynstore-54d36). Estos valores son públicos por diseño —Firebase
// los envía a todos los navegadores— y la seguridad de los datos la dan las
// reglas de firestore.rules. Si se definen las variables
// NEXT_PUBLIC_FIREBASE_* (en Vercel o .env.local), tienen prioridad.
export const FIREBASE_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBmhOmDyFIP6R_YWAV7RpA-tnYg2ugcAyo',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'brooklynstore-54d36.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'brooklynstore-54d36',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'brooklynstore-54d36.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '158814774246',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:158814774246:web:e90d61cb742d8a7f5d2c27',
};
