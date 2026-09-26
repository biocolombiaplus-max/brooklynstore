import type { Metadata } from 'next';
import Link from 'next/link';
import { HELP_GROUPS, HELP_PAGES } from '@/lib/help-pages';

export const metadata: Metadata = {
  title: 'Centro de ayuda',
  description: 'Envíos, pagos, cambios de talla, garantía y todo lo que necesitas saber para comprar en Brooklyn Store.',
};

export default function AyudaPage() {
  return (
    <div>
      <p className="section-eyebrow">Centro de ayuda</p>
      <h1 className="mt-2 font-heading text-3xl font-black uppercase leading-tight text-ink sm:text-5xl">¿En qué te ayudamos?</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">
        Todo lo que necesitas para comprar tranquilo: envíos, formas de pago, cambios de talla y garantía. Si no encuentras lo que buscas,
        escríbenos por WhatsApp.
      </p>

      <Link
        href="/ayuda/rastrear-pedido"
        className="group relative mt-8 flex items-center justify-between gap-4 overflow-hidden rounded-3xl bg-[#0a0a0a] p-6 text-white ring-1 ring-primary/40 sm:p-8"
      >
        <span className="pointer-events-none absolute -left-10 -top-16 h-52 w-52 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.3),transparent_70%)]" />
        <span className="relative flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold-gradient text-2xl">📦</span>
          <span>
            <span className="block text-lg font-black uppercase sm:text-xl">Rastrear mi pedido</span>
            <span className="block text-sm text-white/65">Consulta el estado de tu compra y tu guía Servientrega</span>
          </span>
        </span>
        <span className="relative shrink-0 text-2xl text-primary-light transition-transform group-hover:translate-x-1">→</span>
      </Link>

      {HELP_GROUPS.map((g) => (
        <section key={g.key} className="mt-10">
          <h2 className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted">{g.label}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {HELP_PAGES.filter((p) => p.group === g.key && p.slug !== 'rastrear-pedido').map((p) => (
              <Link
                key={p.slug}
                href={`/ayuda/${p.slug}`}
                className="group flex items-start gap-3 rounded-2xl bg-white p-5 shadow-soft ring-1 ring-border transition-all hover:-translate-y-0.5 hover:ring-primary/50"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cream-alt text-xl">{p.icon}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-black uppercase tracking-wide text-ink">
                    {p.title}
                    <span className="text-primary transition-transform group-hover:translate-x-0.5">→</span>
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted">{p.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
