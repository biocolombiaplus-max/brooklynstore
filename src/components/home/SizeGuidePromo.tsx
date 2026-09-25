import Link from 'next/link';
import FootMeasureIllustration from '../sizes/FootMeasureIllustration';

export default function SizeGuidePromo() {
  return (
    <section className="bg-white py-14 sm:py-20">
      <div className="container-page">
        <div className="grid items-center gap-8 overflow-hidden rounded-3xl bg-gold-50 p-7 ring-1 ring-primary/30 sm:p-12 md:grid-cols-[1fr_220px]">
          <div>
            <p className="section-eyebrow">📏 Tu talla, a la primera</p>
            <h2 className="section-title mt-2">¿No sabes qué talla pedir?</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
              Mide tu pie con una hoja y una regla, escribe los centímetros en nuestra calculadora y te decimos tu talla exacta.
              Además te indicamos si cada modelo calza pequeño, normal o grande. Cero sorpresas.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/guia-de-tallas" className="btn-dark">
                Calcular mi talla →
              </Link>
            </div>
          </div>
          <FootMeasureIllustration className="mx-auto hidden h-56 w-auto md:block" />
        </div>
      </div>
    </section>
  );
}
