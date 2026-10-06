import type { Metadata } from 'next';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

// Al instalar el panel en la pantalla de inicio (necesario en iPhone para
// recibir notificaciones) se abre directo en Pedidos, como la app de Shopify.
export const metadata: Metadata = {
  title: 'Brooklyn Admin',
  appleWebApp: { capable: true, title: 'Brooklyn Admin', statusBarStyle: 'black' },
  robots: { index: false, follow: false },
};

// El panel administrativo depende siempre de datos en vivo de Firestore/Auth,
// así que no tiene sentido pre-renderizarlo de forma estática en el build.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
