function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Reduce el archivo si la foto es muy pesada (celulares modernos suben
// fotos de 12+ MP), sin recortar ni deformar nada — se mantiene la
// proporción original completa. El encuadre final a cuadrado, sin franjas
// de fondo y sin importar el tamaño o proporción de la foto, lo hace
// Cloudinary automáticamente al mostrarla (ver AUTO_OPTIMIZE en storage.ts),
// detectando con IA en qué parte de la foto está el producto.
export async function resizeForUpload(file: File, maxDimension = 2000): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    if (image.width <= maxDimension && image.height <= maxDimension) {
      return file;
    }
    const scale = maxDimension / Math.max(image.width, image.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))),
        'image/jpeg',
        0.9,
      );
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
