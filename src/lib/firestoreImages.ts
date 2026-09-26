'use client';

import { addDoc, Bytes, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// Respaldo para las fotos cuando Cloudinary no está configurado: la foto se
// procesa en el navegador (recorte/encuadre + WebP comprimido) y se guarda en
// Firestore, en la colección "images". La tienda la muestra desde
// /api/img/<id>, con caché de un año, así que casi no gasta lecturas.

export const FIRESTORE_IMAGE_PREFIX = '/api/img/';
const MAX_BYTES = 880_000; // Firestore acepta documentos de hasta ~1 MB.

type Mode = 'fill' | 'fit' | 'original';

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la foto. Prueba con otra imagen (JPG, PNG o WebP).'));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function draw(img: HTMLImageElement, mode: Mode, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tu navegador no pudo procesar la foto.');
  ctx.imageSmoothingQuality = 'high';

  if (mode === 'original') {
    const scale = Math.min(1, size / Math.max(img.width, img.height));
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  canvas.width = size;
  canvas.height = size;
  if (mode === 'fit') {
    // Foto completa, sin recortar, centrada sobre fondo blanco.
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    const scale = Math.min(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  } else {
    // Llena el cuadrado recortando lo que sobre, centrado.
    const scale = Math.max(size / img.width, size / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
  }
  return canvas;
}

async function compress(file: Blob, mode: Mode): Promise<Blob> {
  const img = await loadImage(file);
  const sizes = mode === 'original' ? [1600, 1300, 1000, 800] : [1200, 1000, 800, 640];
  for (const size of sizes) {
    const canvas = draw(img, mode, size);
    for (const quality of [0.86, 0.78, 0.68, 0.58]) {
      let blob = await toBlob(canvas, 'image/webp', quality);
      // Navegadores sin WebP devuelven PNG: se usa JPEG en fotos sin transparencia.
      if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, mode === 'original' ? 'image/png' : 'image/jpeg', quality);
      if (blob && blob.size <= MAX_BYTES) return blob;
    }
  }
  throw new Error('La foto es demasiado pesada incluso comprimida. Prueba con otra de menor resolución.');
}

export async function uploadImageToFirestore(file: Blob, mode: Mode): Promise<string> {
  if (!db) throw new Error('No hay conexión con la base de datos. Revisa tu internet e intenta de nuevo.');
  const blob = await compress(file, mode);
  const bytes = Bytes.fromUint8Array(new Uint8Array(await blob.arrayBuffer()));
  try {
    const ref = await addDoc(collection(db, 'images'), {
      data: bytes,
      contentType: blob.type,
      size: blob.size,
      createdAt: serverTimestamp(),
    });
    return `${FIRESTORE_IMAGE_PREFIX}${ref.id}`;
  } catch (error) {
    if ((error as { code?: string })?.code === 'permission-denied') {
      throw new Error(
        'Firebase no dio permiso para guardar la foto. Actualiza las reglas de Firestore (agrega el bloque "images" de firestore.rules) y vuelve a intentar.',
      );
    }
    throw new Error('No se pudo guardar la foto. Revisa tu conexión e intenta de nuevo.');
  }
}

export async function deleteFirestoreImage(url: string): Promise<void> {
  if (!db || !url.startsWith(FIRESTORE_IMAGE_PREFIX)) return;
  const id = url.slice(FIRESTORE_IMAGE_PREFIX.length);
  await deleteDoc(doc(db, 'images', id)).catch(() => {});
}
