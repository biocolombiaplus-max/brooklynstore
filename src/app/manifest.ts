import type { MetadataRoute } from 'next';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Brooklyn Store';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${STORE_NAME} — Tienda de zapatos en Ecuador`,
    short_name: STORE_NAME,
    description: 'Zapatos multimarca con envío a todo el Ecuador. Transferencia o pago contra entrega.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#B8923A',
    icons: [
      { src: '/icon', sizes: '64x64', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
      { src: '/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
