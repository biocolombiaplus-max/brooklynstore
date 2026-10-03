import type { Metadata } from 'next';
import Link from 'next/link';
import CopyGuideButton from '@/components/CopyGuideButton';

// Guía de envío que recibe el cliente por WhatsApp: número de guía grande,
// la foto o el PDF de la guía de Servientrega y botones para descargarla y
// rastrear el paquete. Si la guía es una foto, esa foto es la vista previa
// del link en WhatsApp.

interface Props {
  searchParams: { f?: string; t?: string; n?: string; g?: string };
}

// Solo se muestran archivos de la tienda (Firestore o Cloudinary).
function safeFile(f?: string): string | null {
  if (!f) return null;
  if (/^\/api\/img\/[A-Za-z0-9]{10,40}$/.test(f)) return f;
  if (/^https:\/\/res\.cloudinary\.com\//.test(f)) return f;
  return null;
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const file = safeFile(searchParams.f);
  const isPdf = searchParams.t === 'pdf';
  const title = `Guía de envío${searchParams.n ? ` · Pedido ${searchParams.n}` : ''}`;
  const description = searchParams.g ? `Servientrega · Guía N.º ${searchParams.g}` : 'Tu pedido va en camino con Servientrega';
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, ...(file && !isPdf ? { images: [{ url: file, alt: 'Guía de envío' }] } : {}) },
  };
}

export default function GuiaPage({ searchParams }: Props) {
  const file = safeFile(searchParams.f);
  const isPdf = searchParams.t === 'pdf';

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 text-white sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <p className="text-center text-[10px] font-extrabold uppercase tracking-[0.3em] text-primary-light">Brooklyn Store</p>
        <h1 className="mt-2 text-center font-heading text-3xl font-black uppercase">¡Tu pedido va en camino! 🚚</h1>
        {searchParams.n && <p className="mt-1 text-center text-sm text-white/60">Pedido {searchParams.n}</p>}

        {searchParams.g && (
          <div className="mt-6 rounded-3xl bg-gold-gradient p-5 text-center text-ink">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em]">Número de guía Servientrega</p>
            <CopyGuideButton value={searchParams.g} />
          </div>
        )}

        {file && (
          <div className="mt-5 overflow-hidden rounded-3xl bg-white ring-1 ring-white/10">
            {isPdf ? (
              <object data={file} type="application/pdf" className="h-[70vh] w-full">
                <div className="p-6 text-center text-sm text-ink">Tu celular no puede mostrar el PDF aquí. Descárgalo con el botón de abajo.</div>
              </object>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file} alt="Guía de envío" className="w-full" />
            )}
          </div>
        )}

        <div className="mt-5 grid gap-3">
          {file && (
            <a href={file} download={isPdf ? `guia-${searchParams.n ?? 'envio'}.pdf` : undefined} target="_blank" rel="noopener noreferrer" className="btn-primary btn-shine w-full">
              {isPdf ? '📄 Descargar guía (PDF)' : '📷 Ver guía en tamaño completo'}
            </a>
          )}
          <a href="https://www.servientrega.com.ec/" target="_blank" rel="noopener noreferrer" className="btn-dark w-full ring-1 ring-white/20">
            🔎 Rastrear en Servientrega{searchParams.g ? ' (pega tu guía)' : ''}
          </a>
          <Link href="/" className="py-2 text-center text-xs font-bold text-white/50 underline underline-offset-4">
            Ir a la tienda
          </Link>
        </div>
      </div>
    </main>
  );
}
