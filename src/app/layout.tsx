import type { Metadata, Viewport } from 'next';
import '../styles/globals.css';

const STORE_NAME = process.env.NEXT_PUBLIC_STORE_NAME || 'Brooklyn Store';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app';
const TITLE = `${STORE_NAME} — Zapatos originales multimarca en Ecuador`;
const DESCRIPTION =
  'Nike, Adidas, New Balance, Puma, Converse y más. Zapatos 100% originales con envío a todo el Ecuador. Paga por transferencia o contra entrega adelantando solo $5.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: `%s — ${STORE_NAME}`,
  },
  description: DESCRIPTION,
  keywords: ['zapatos Ecuador', 'zapatos originales', 'Nike Ecuador', 'Adidas Ecuador', 'tienda de zapatos Quito', 'zapatos Guayaquil', 'pago contra entrega Ecuador'],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: STORE_NAME,
    locale: 'es_EC',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: STORE_NAME,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0E0E0E',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="font-body">{children}</body>
    </html>
  );
}
