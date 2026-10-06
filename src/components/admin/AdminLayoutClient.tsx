'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AdminAuthGuard from './AdminAuthGuard';
import AdminSidebar from './AdminSidebar';
import OrderAlertListener from './OrderAlertListener';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // Al instalar el panel en la pantalla de inicio (obligatorio en iPhone
  // para recibir avisos) se usa el manifiesto del admin: ícono "Brooklyn
  // Admin" que abre directo en Pedidos, como la app de Shopify.
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) return;
    const original = link.href;
    link.href = '/admin.webmanifest';
    return () => {
      link.href = original;
    };
  }, []);

  if (isLoginPage) return <>{children}</>;

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen flex-col bg-cream sm:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1 p-4 sm:p-8">
          {/* Barra de notificaciones arriba del contenido (no flotante) para
              que nunca tape los botones de guardar del panel. */}
          <OrderAlertListener />
          {children}
        </div>
      </div>
    </AdminAuthGuard>
  );
}
