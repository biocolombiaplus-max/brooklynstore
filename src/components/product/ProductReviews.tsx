import type { ProductReview } from '@/lib/types';

export default function ProductReviews({ reviews, totalCount }: { reviews: ProductReview[]; totalCount?: number }) {
  if (reviews.length === 0) return null;
  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <section id="resenas" className="mt-16 scroll-mt-24">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="section-eyebrow">Reseñas verificadas</p>
          <h2 className="mt-1 text-2xl font-black uppercase text-ink">Lo que dicen nuestros clientes</h2>
        </div>
        <p className="flex items-center gap-2 text-sm">
          <span className="text-2xl font-black text-ink">{average.toFixed(1)}</span>
          <span className="text-primary">{'★'.repeat(Math.round(average))}</span>
          <span className="text-muted">({totalCount || reviews.length} reseñas)</span>
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-5">
            <p className="text-primary">
              {'★'.repeat(r.rating)}
              <span className="text-border">{'★'.repeat(5 - r.rating)}</span>
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink">&ldquo;{r.text}&rdquo;</p>
            <p className="mt-4 text-xs font-extrabold text-ink">
              {r.name}
              {r.city && <span className="font-normal text-muted"> · 📍 {r.city}</span>}
              <span className="ml-2 font-semibold text-whatsapp">✓ Compra verificada</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
