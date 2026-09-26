'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HELP_GROUPS, HELP_PAGES } from '@/lib/help-pages';
import { classNames } from '@/lib/utils';

// Menú del Centro de ayuda: barra deslizable en celular y columna lateral
// fija en computador, como en las tiendas grandes.
export default function HelpNav() {
  const pathname = usePathname();
  const active = (slug: string) => pathname === `/ayuda/${slug}`;

  return (
    <>
      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:hidden" aria-label="Centro de ayuda">
        <Link
          href="/ayuda"
          className={classNames(
            'shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition-colors',
            pathname === '/ayuda' ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-border',
          )}
        >
          Todo
        </Link>
        {HELP_PAGES.map((p) => (
          <Link
            key={p.slug}
            href={`/ayuda/${p.slug}`}
            className={classNames(
              'shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold transition-colors',
              active(p.slug) ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-border',
            )}
          >
            {p.icon} {p.title}
          </Link>
        ))}
      </nav>

      <nav className="sticky top-28 hidden space-y-6 lg:block" aria-label="Centro de ayuda">
        {HELP_GROUPS.map((g) => (
          <div key={g.key}>
            <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted">{g.label}</p>
            <ul className="space-y-0.5">
              {HELP_PAGES.filter((p) => p.group === g.key).map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/ayuda/${p.slug}`}
                    className={classNames(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors',
                      active(p.slug) ? 'bg-ink text-white shadow-dark' : 'text-ink hover:bg-white',
                    )}
                  >
                    <span className="w-5 text-center">{p.icon}</span>
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}
