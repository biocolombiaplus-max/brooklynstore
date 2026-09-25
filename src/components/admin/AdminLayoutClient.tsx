'use client';

import { usePathname } from 'next/navigation';
import AdminAuthGuard from './AdminAuthGuard';
import AdminSidebar from './AdminSidebar';
import OrderAlertListener from './OrderAlertListener';

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  if (isLoginPage) return <>{children}</>;

  return (
    <AdminAuthGuard>
      <div className="flex min-h-screen flex-col bg-cream sm:flex-row">
        <AdminSidebar />
        <div className="flex-1 p-4 sm:p-8">{children}</div>
        <OrderAlertListener />
      </div>
    </AdminAuthGuard>
  );
}
