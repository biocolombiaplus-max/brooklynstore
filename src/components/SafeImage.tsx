'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';

// next/image con respaldo: si una foto no carga (enlace roto, foto borrada
// de Cloudinary, sin internet...), en vez de un hueco feo se muestra un
// fondo con el monograma dorado de la tienda.
export default function SafeImage({ alt, className, ...props }: ImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !props.src) {
    return (
      <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cream-alt to-gold-100">
        <span className="font-display text-4xl font-bold text-primary/50">BS</span>
      </span>
    );
  }

  return <Image alt={alt} className={className} onError={() => setFailed(true)} {...props} />;
}
