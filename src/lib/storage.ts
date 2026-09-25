// Hospedaje de imágenes con Cloudinary (plan gratis, sin tarjeta de crédito),
// en lugar de Firebase Storage — que ahora exige el plan de pago Blaze
// incluso para uso gratuito. Mantiene la misma firma de funciones que antes
// para no tener que tocar el formulario de productos.

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

// Dos formas de encuadrar la foto a cuadrado, elegidas por el admin al
// subirla (ver el interruptor en "Fotos del producto"):
//  - "fill" (por defecto, de siempre): recorta con IA (g_auto detecta el
//    producto), llena todo el cuadrado sin franjas — pero en fotos muy
//    verticales puede cortarle un pedazo al producto.
//  - "fit": nunca recorta — encoge la foto completa dentro del cuadrado y
//    rellena el espacio sobrante con un fondo automático a juego.
// Cualquiera de los dos comprime y sirve en el formato más liviano posible
// (WebP/AVIF) automáticamente, todo vía transformación en la propia URL,
// sin costo extra.
const CROP_TRANSFORMS = {
  fill: 'c_fill,g_auto,w_1200,h_1200,q_auto,f_auto',
  // "g_auto" (gravedad con IA) solo tiene sentido cuando se recorta — en
  // "pad" no se recorta nada, así que se quita. "b_auto" (fondo automático)
  // no es confiable en todas las cuentas de Cloudinary sin firmar la
  // petición, así que se usa un color sólido fijo — blanco, para que las
  // franjas se noten lo menos posible tanto en las tarjetas de producto
  // (fondo blanco) como en la ficha del producto.
  fit: 'c_pad,b_white,w_1200,h_1200,q_auto,f_auto',
} as const;

export type ImageCropMode = keyof typeof CROP_TRANSFORMS;

function withAutoOptimization(url: string, mode: ImageCropMode): string {
  return url.replace('/image/upload/', `/image/upload/${CROP_TRANSFORMS[mode]}/`);
}

export async function uploadProductImage(
  file: File,
  _productSlug: string,
  cropMode: ImageCropMode = 'fill',
): Promise<string> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary no está configurado. Agrega NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET (ver README.md).',
    );
  }

  // Deliberadamente solo se envían "file" y "upload_preset": son los dos
  // únicos parámetros que Cloudinary permite sin restricción en TODAS las
  // cuentas para subidas "unsigned". Parámetros como "folder" pueden ser
  // rechazados según el modo de carpetas de la cuenta (cuentas nuevas usan
  // "Dynamic Folder Mode" por defecto), así que se evitan para máxima
  // compatibilidad.
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || `No se pudo subir la imagen (error ${response.status}).`;
    throw new Error(message);
  }

  if (!data?.secure_url) {
    throw new Error('Cloudinary no devolvió la URL de la imagen. Intenta de nuevo.');
  }

  return withAutoOptimization(data.secure_url as string, cropMode);
}

export async function deleteProductImage(_url: string): Promise<void> {
  // Borrar un archivo en Cloudinary requiere firmar la petición con la API
  // secret, que nunca debe exponerse en el navegador (necesitaría una
  // función de servidor). Por ahora solo se quita de la lista de fotos del
  // producto; el archivo original queda en tu cuenta de Cloudinary y puedes
  // borrarlo manualmente desde su panel si lo deseas.
}
