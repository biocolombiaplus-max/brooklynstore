import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

// El panel administrativo depende siempre de datos en vivo de Firestore/Auth,
// así que no tiene sentido pre-renderizarlo de forma estática en el build.
export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
