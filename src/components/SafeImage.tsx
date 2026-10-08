'use client';

import Image, { type ImageProps } from 'next/image';
import { useEffect, useState } from 'react';

// next/image con respaldo: si una foto no carga (servidor ocupado, sin
// internet...) se reintenta sola un par de veces; solo si sigue fallando se
// muestra un fondo con el monograma dorado de la tienda en vez de un hueco.
const RETRIES = 2;

// hideOnError: para fotos secundarias (la del mouse): si fallan no se muestra
// nada, así su respaldo no tapa la foto principal.
export default function SafeImage({ alt, className, hideOnError, ...props }: ImageProps & { hideOnError?: boolean }) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  // Si la foto cambia (otro color), se empieza de cero.
  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [props.src]);

  if (failed || !props.src) {
    if (hideOnError) return null;
    return (
      <span className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cream-alt to-gold-100">
        <span className="font-display text-4xl font-bold text-primary/50">BS</span>
      </span>
    );
  }

  return (
    <Image
      key={attempt}
      alt={alt}
      className={className}
      onError={() => {
        if (attempt < RETRIES) setTimeout(() => setAttempt((a) => a + 1), 1200 * (attempt + 1));
        else setFailed(true);
      }}
      {...props}
    />
  );
}
