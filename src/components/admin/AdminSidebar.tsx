'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAdmin } from '@/lib/auth';
import { useAdminUser } from '@/lib/admin-context';
import { classNames } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: '📊 Panel', exact: true },
  { href: '/admin/productos', label: '👡 Productos' },
  { href: '/admin/pedidos', label: '📦 Pedidos' },
  { href: '/admin/configuracion', label: '⚙️ Configuración' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAdminUser();

  async function handleLogout() {
    await logoutAdmin();
    router.push('/admin/login');
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-white p-4 sm:w-56 sm:min-h-screen sm:border-b-0 sm:border-r">
      <div className="mb-6">
        <p className="font-heading text-lg font-bold text-ink">Brooklyn Admin</p>
        {user?.email && <p className="truncate text-xs text-muted">{user.email}</p>}
      </div>
      <nav className="flex flex-1 gap-2 sm:flex-col">
        {LINKS.map((link) => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={classNames(
                'rounded-lg px-3 py-2 text-sm font-semibold',
                active ? 'bg-primary text-white' : 'text-ink hover:bg-cream-alt',
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <button onClick={handleLogout} className="mt-6 text-left text-sm font-semibold text-muted hover:text-urgent">
        Cerrar sesión
      </button>
      <Link href="/" className="mt-2 text-left text-xs text-muted hover:text-primary">
        ← Ver tienda
      </Link>
    </aside>
  );
}
