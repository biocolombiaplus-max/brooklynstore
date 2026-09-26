import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HELP_PAGES, helpPage } from '@/lib/help-pages';
import HelpArticle from '@/components/help/HelpArticle';

export function generateStaticParams() {
  return HELP_PAGES.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const page = helpPage(params.slug);
  if (!page) return {};
  return { title: page.title, description: page.description };
}

export default function HelpArticlePage({ params }: { params: { slug: string } }) {
  const page = helpPage(params.slug);
  if (!page) notFound();

  return (
    <article>
      <nav className="mb-4 text-xs text-muted">
        <Link href="/" className="hover:text-primary">Inicio</Link> /{' '}
        <Link href="/ayuda" className="hover:text-primary">Centro de ayuda</Link> / <span className="text-ink">{page.title}</span>
      </nav>
      <div className="flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gold-gradient text-2xl shadow-lift">{page.icon}</span>
        <div>
          <h1 className="font-heading text-2xl font-black uppercase leading-tight text-ink sm:text-4xl">{page.title}</h1>
          <p className="mt-1 text-sm text-muted">{page.description}</p>
        </div>
      </div>
      <div className="mt-8">
        <HelpArticle slug={page.slug} />
      </div>
    </article>
  );
}
