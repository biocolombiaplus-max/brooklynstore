/**
 * Script de datos de ejemplo.
 *
 * Requiere que ya exista un usuario administrador (ver README, sección
 * "Crear tu primer usuario administrador") y sus credenciales en .env.local:
 *   SEED_ADMIN_EMAIL=tu-correo@ejemplo.com
 *   SEED_ADMIN_PASSWORD=tu-contraseña
 *
 * Ejecuta:  npm run seed
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { DEMO_PRODUCTS } from '../src/lib/demo-products';
import { FIREBASE_CONFIG } from '../src/lib/firebase-config';

const firebaseConfig = FIREBASE_CONFIG;

// Sube a Firestore el mismo catálogo de demostración que muestra la tienda
// mientras no hay productos propios, para editarlo desde /admin/productos
// (cambiar precios, stock y reemplazar las fotos de ejemplo por las reales).
const SAMPLE_PRODUCTS = DEMO_PRODUCTS.map(({ id: _id, createdAt: _createdAt, ...product }) => product);

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error('Faltan SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD en .env.local');
    process.exit(1);
  }

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, email, password);
  console.log(`Autenticado como ${email}. Creando productos de ejemplo...`);

  for (const product of SAMPLE_PRODUCTS) {
    await addDoc(collection(db, 'products'), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log(`✓ Creado: ${product.title}`);
  }

  console.log('¡Listo! Ingresa a /admin/productos para ajustar precios, stock y subir tus fotos reales.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
