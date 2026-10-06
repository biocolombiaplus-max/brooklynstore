/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/webp'],
    // Las fotos nunca cambian (una foto nueva recibe otra URL): la versión
    // optimizada se guarda un año en la CDN y no se vuelve a procesar.
    minimumCacheTTL: 31536000,
    // Tamaños pensados para celulares: archivos más livianos.
    deviceSizes: [384, 640, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 180, 256],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;
