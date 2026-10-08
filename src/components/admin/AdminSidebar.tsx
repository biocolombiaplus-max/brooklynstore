'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAdmin } from '@/lib/auth';
import { useAdminUser } from '@/lib/admin-context';
import { classNames } from '@/lib/utils';

const LINKS = [
  { href: '/admin', icon: '📊', label: 'Panel', exact: true },
  { href: '/admin/productos', icon: '👡', label: 'Productos' },
  { href: '/admin/productos/carga-rapida', icon: '⚡', label: 'Carga rápida' },
  { href: '/admin/pedidos', icon: '📦', label: 'Pedidos' },
  { href: '/admin/visitantes', icon: '👀', label: 'Visitantes' },
  { href: '/admin/fidelizacion', icon: '⭐', label: 'Fidelización' },
  { href: '/admin/configuracion', icon: '⚙️', label: 'Configuración' },
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
    <aside className="flex w-full shrink-0 flex-col border-b border-border bg-white p-3 sm:min-h-screen sm:w-56 sm:border-b-0 sm:border-r sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3 sm:mb-6 sm:block">
        <div className="min-w-0">
          <p className="font-heading text-lg font-bold text-ink">Brooklyn Admin</p>
          {user?.email && <p className="truncate text-xs text-muted">{user.email}</p>}
        </div>
        {/* En celular: acciones arriba, a la derecha */}
        <div className="flex shrink-0 flex-col items-end gap-1 sm:hidden">
          <Link href="/" className="text-xs font-semibold text-muted">
            ← Ver tienda
          </Link>
          <button onClick={handleLogout} className="text-xs font-semibold text-muted">
            Cerrar sesión
          </button>
        </div>
      </div>
      {/* Celular: cuadrícula con todas las secciones a la vista. PC: lista lateral. */}
      <nav className="grid flex-1 grid-cols-4 gap-1.5 sm:flex sm:flex-col sm:gap-2">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href) &&
              // "Productos" no se marca cuando estás en "Carga rápida" (tiene su propio enlace).
              !(link.href === '/admin/productos' && pathname.startsWith('/admin/productos/carga-rapida'));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={classNames(
                'flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-center text-[11px] font-semibold leading-tight sm:flex-row sm:justify-start sm:gap-2 sm:rounded-lg sm:px-3 sm:py-2 sm:text-left sm:text-sm',
                active ? 'bg-primary text-white' : 'bg-cream-alt/60 text-ink hover:bg-cream-alt sm:bg-transparent',
              )}
            >
              <span className="text-lg leading-none sm:text-base">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
      <button onClick={handleLogout} className="mt-6 hidden text-left text-sm font-semibold text-muted hover:text-urgent sm:block">
        Cerrar sesión
      </button>
      <Link href="/" className="mt-2 hidden text-left text-xs text-muted hover:text-primary sm:block">
        ← Ver tienda
      </Link>
    </aside>
  );
}
