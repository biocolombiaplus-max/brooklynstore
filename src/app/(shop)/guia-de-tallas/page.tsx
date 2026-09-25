import type { Metadata } from 'next';
import Link from 'next/link';
import SizeGuide from '@/components/sizes/SizeGuide';

export const metadata: Metadata = {
  title: 'Guía de tallas',
  description: 'Calcula tu talla exacta de zapatos en centímetros. Tabla de equivalencias EC, EU y US para hombre, mujer y niños.',
};

export default function GuiaDeTallasPage() {
  return (
    <div className="container-page max-w-3xl py-10 sm:py-14">
      <nav className="mb-4 text-xs text-muted">
        <Link href="/" className="hover:text-primary">Inicio</Link> / <span className="text-ink">Guía de tallas</span>
      </nav>
      <p className="section-eyebrow">📏 Guía de tallas</p>
      <h1 className="section-title mt-2">Encuentra tu talla perfecta</h1>
      <p className="mt-3 text-sm text-muted sm:text-base">
        En Brooklyn Store usamos la talla ecuatoriana (EC). Si conoces tu talla en EU o US, búscala en la tabla. Y si tienes dudas,
        escríbenos por WhatsApp: te asesoramos ya mismo.
      </p>
      <div className="mt-8">
        <SizeGuide />
      </div>
      <div className="mt-10 text-center">
        <Link href="/catalogo" className="btn-primary btn-shine">
          Ya sé mi talla, quiero comprar →
        </Link>
      </div>
    </div>
  );
}
