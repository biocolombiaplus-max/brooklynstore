'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ExchangePolicy from '@/components/ExchangePolicy';
import PaymentLogos, { CourierLogo } from '@/components/brand/PaymentLogos';
import { WhatsAppIcon } from '@/components/icons';
import { HELP_UPDATED } from '@/lib/help-pages';
import { getLastLocalOrder } from '@/lib/localOrders';
import { useSiteSettings } from '@/lib/settings-context';
import type { Order } from '@/lib/types';
import { classNames, formatPrice, paymentMethodLabel, whatsappLinkTo } from '@/lib/utils';
import { generalMessage } from '@/lib/wa-messages';

// ——— Piezas de diseño compartidas ———

function Block({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={classNames('rounded-3xl bg-white p-5 shadow-soft ring-1 ring-border sm:p-7', className)}>
      {title && <h2 className="mb-3 text-base font-black uppercase tracking-wide text-ink sm:text-lg">{title}</h2>}
      <div className="space-y-3 text-sm leading-relaxed text-muted sm:text-[15px]">{children}</div>
    </section>
  );
}

function Steps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="rounded-2xl bg-white p-5 shadow-soft ring-1 ring-border">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient text-sm font-black text-ink">{i + 1}</span>
          <p className="mt-3 text-sm font-black uppercase tracking-wide text-ink">{s.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

function Highlights({ items }: { items: { icon: string; title: string; text: string }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.title} className="rounded-2xl bg-[#0a0a0a] p-5 text-white ring-1 ring-primary/30">
          <span className="text-2xl">{it.icon}</span>
          <p className="mt-2 text-sm font-black uppercase tracking-wide">{it.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/65">{it.text}</p>
        </div>
      ))}
    </div>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-100 text-[10px] font-black text-primary-hover">✓</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function Legal({ sections }: { sections: { title: string; body: React.ReactNode }[] }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-border sm:p-8">
      <p className="text-xs font-bold uppercase tracking-wider text-muted">Última actualización: {HELP_UPDATED}</p>
      <div className="mt-6 space-y-7">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="text-sm font-black uppercase tracking-wide text-ink sm:text-base">
              {i + 1}. {s.title}
            </h2>
            <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

function WaButton({ message, label, className }: { message: string; label: string; className?: string }) {
  const { whatsappNumber, whatsappCountryCode } = useSiteSettings();
  return (
    <a
      href={whatsappLinkTo(whatsappNumber, message, whatsappCountryCode)}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames('btn-whatsapp btn-shine', className)}
    >
      <WhatsAppIcon /> {label}
    </a>
  );
}

// ——— Páginas ———

function RastrearPedido() {
  const [last, setLast] = useState<Order | null>(null);
  const [orderNumber, setOrderNumber] = useState('');
  const [guide, setGuide] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const o = getLastLocalOrder();
    setLast(o);
    if (o) setOrderNumber(o.orderNumber);
  }, []);

  const trackMessage = `¡Hola Brooklyn Store! 👋 Quiero saber el estado de mi pedido${orderNumber.trim() ? ` *${orderNumber.trim().toUpperCase()}*` : ''}. 📦`;

  return (
    <div className="space-y-5">
      {last && (
        <Block title="Tu último pedido">
          <div className="flex flex-col gap-3 rounded-2xl bg-cream-alt/70 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-base font-black text-ink">{last.orderNumber}</p>
              <p className="text-xs">
                {last.items.map((i) => `${i.title} (talla ${i.size})`).join(' · ')}
              </p>
              <p className="text-xs">
                {paymentMethodLabel(last.paymentMethod)} · Total {formatPrice(last.total)}
              </p>
            </div>
            <Link href={`/pedido-confirmado/${last.id}`} className="btn-dark shrink-0 px-5 py-3 text-xs">
              Ver datos de pago
            </Link>
          </div>
        </Block>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Block title="1. Consulta tu pedido">
          <p>Escribe tu número de pedido (empieza con BS-) y te decimos por WhatsApp en qué va tu compra.</p>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Ej: BS-20260926-1234"
            className="input uppercase"
          />
          <WaButton message={trackMessage} label="Consultar estado" className="w-full" />
        </Block>

        <Block title="2. Rastrea tu guía Servientrega">
          <p>Cuando despachamos te enviamos el número de guía por WhatsApp. Pégalo aquí y sigue tu paquete en la página de Servientrega.</p>
          <input value={guide} onChange={(e) => setGuide(e.target.value.replace(/\s/g, ''))} placeholder="Número de guía" className="input" />
          <button
            type="button"
            disabled={!guide}
            onClick={() => {
              navigator.clipboard?.writeText(guide).catch(() => {});
              setCopied(true);
              window.open('https://www.servientrega.com.ec/', '_blank', 'noopener');
            }}
            className="btn-dark w-full disabled:opacity-40"
          >
            <CourierLogo size="sm" /> Rastrear en Servientrega
          </button>
          {copied && <p className="text-xs font-bold text-whatsapp">✓ Copiamos tu guía: pégala en la opción “Rastreo” de Servientrega.</p>}
        </Block>
      </div>

      <Block title="Así avanza tu pedido">
        <ol className="relative space-y-5 border-l-2 border-primary/30 pl-6">
          {[
            { t: 'Pedido recibido', d: 'Nos llega tu pedido por WhatsApp con todos los datos.' },
            { t: 'Pago confirmado', d: 'Validamos tu comprobante (o el adelanto del envío si es contra entrega).' },
            { t: 'Despachado', d: 'Tu pedido sale con Servientrega y te mandamos el número de guía.' },
            { t: 'Entregado', d: '¡A estrenar! Recuerda: tienes 48 horas para pedir cambio de talla.' },
          ].map((s) => (
            <li key={s.t} className="relative">
              <span className="absolute -left-[33px] top-0.5 h-4 w-4 rounded-full border-2 border-white bg-gold-gradient shadow" />
              <p className="text-sm font-black uppercase tracking-wide text-ink">{s.t}</p>
              <p className="text-xs">{s.d}</p>
            </li>
          ))}
        </ol>
      </Block>
    </div>
  );
}

function Envios() {
  const { shipping, courier, payments } = useSiteSettings();
  return (
    <div className="space-y-5">
      <Highlights
        items={[
          { icon: '🇪🇨', title: 'Todo el Ecuador', text: 'Llegamos a las 24 provincias: ciudades, cantones y parroquias.' },
          { icon: '⏱️', title: shipping.deliveryTime, text: 'Tiempo estimado de entrega una vez confirmado tu pago.' },
          { icon: '📦', title: 'Con número de guía', text: 'Sigues tu paquete en todo momento con Servientrega.' },
        ]}
      />
      <Block title="Trabajamos con Servientrega">
        <div className="flex items-center gap-3">
          <CourierLogo />
          <span className="text-xs">La red de envíos más grande del país.</span>
        </div>
        <p>
          Despachamos todos nuestros pedidos con {courier.name}. Apenas tu pedido sale te enviamos por WhatsApp el número de guía para que
          sepas exactamente dónde está.
        </p>
      </Block>
      <Block title="¿Cuándo despachamos?">
        <List
          items={[
            'Despachamos el mismo día en que se confirma tu pago (pedidos confirmados en horario laborable).',
            `El tiempo de entrega es de ${shipping.deliveryTime}, según tu ciudad.`,
            'Zonas rurales o de difícil acceso pueden tardar un poco más; te avisamos antes de despachar.',
          ]}
        />
      </Block>
      <Block title="Costo del envío">
        <List
          items={[
            'Pagando por transferencia o depósito, el valor del envío se muestra en el checkout antes de confirmar tu pedido. Sin sorpresas.',
            payments.codEnabled
              ? `Con pago contra entrega adelantas solo ${formatPrice(payments.codAdvance)} del envío y pagas tus zapatos al recibirlos.`
              : '',
            shipping.rates.length
              ? `Destinos con tarifa especial: ${shipping.rates.map((r) => r.province).join(', ')}.`
              : '',
          ].filter(Boolean)}
        />
      </Block>
      <Block title="Al recibir tu pedido">
        <List
          items={[
            'Revisa que el paquete llegue cerrado y en buen estado antes de firmar.',
            'Verifica que el modelo, color y talla sean los que pediste.',
            'Cualquier novedad, escríbenos por WhatsApp en ese mismo momento con fotos.',
          ]}
        />
      </Block>
    </div>
  );
}

function MetodosPago() {
  const { payments } = useSiteSettings();
  const rest = payments.codUnitPrice > 0 ? payments.codUnitPrice : payments.defaultPrice;
  return (
    <div className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <Block title="🏦 Transferencia o depósito">
          <p>
            Transfiere desde la app de cualquier banco o deposita en <strong className="text-ink">Banco Pichincha</strong> (ventanilla o agente
            Pichincha Mi Vecino).
          </p>
          <List
            items={[
              `Precio por par: ${formatPrice(payments.defaultPrice)}.`,
              'Al confirmar tu pedido te mostramos nuestra cuenta oficial con botones para copiar cada dato.',
              'Envías la foto del comprobante por WhatsApp y despachamos el mismo día.',
            ]}
          />
        </Block>
        {payments.codEnabled && (
          <Block title="💵 Pago contra entrega" className="ring-2 ring-primary/40">
            <p>Ideal si prefieres pagar cuando tienes tus zapatos en la mano.</p>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-2xl bg-ink p-3 text-white">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary-light">Hoy</p>
                <p className="text-2xl font-black">{formatPrice(payments.codAdvance)}</p>
                <p className="text-[10px] text-white/60">envío</p>
              </div>
              <div className="rounded-2xl bg-cream-alt p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted">Al recibir</p>
                <p className="text-2xl font-black text-ink">{formatPrice(rest)}</p>
                <p className="text-[10px]">en efectivo, por par</p>
              </div>
            </div>
            <p className="text-xs">El adelanto del envío se paga por transferencia o depósito en Banco Pichincha y garantiza tu pedido.</p>
          </Block>
        )}
      </div>
      <Block title="Paga desde tu banco o app favorita">
        <PaymentLogos />
      </Block>
      <Block title="Pagos seguros">
        <List
          items={[
            'Solo tenemos una cuenta oficial, a nombre del titular que ves al confirmar tu pedido. Nunca te pediremos pagar a otra cuenta.',
            'Todo pedido se confirma por WhatsApp con nuestro número oficial.',
            'Si algo no te cuadra, escríbenos antes de pagar: con gusto verificamos contigo.',
          ]}
        />
      </Block>
    </div>
  );
}

function Cambios() {
  const { exchangeWindowHours: hours } = useSiteSettings();
  return (
    <div className="space-y-5">
      <ExchangePolicy />
      <Block title="Condiciones para el cambio de talla">
        <List
          items={[
            `Nos avisas por WhatsApp dentro de las ${hours} horas siguientes a recibir tu pedido.`,
            'El zapato debe estar sin uso, limpio, con su caja, etiquetas y accesorios originales.',
            'El cambio está sujeto a disponibilidad de la talla en el mismo modelo. Si no hay, te ofrecemos otro modelo.',
            'Los costos de envío del cambio te los confirmamos por WhatsApp antes de coordinar el retiro.',
          ]}
        />
      </Block>
      <Block title="Devoluciones">
        <p>
          Si tu pedido llega con un <strong className="text-ink">defecto de fábrica</strong> o recibes un producto distinto al que pediste, te lo
          cambiamos sin costo. Escríbenos con fotos dentro de las {hours} horas de recibido y lo solucionamos.
        </p>
        <p>Por higiene y cuidado del producto, no aceptamos devoluciones de zapatos usados.</p>
      </Block>
      <Block title="Para no fallar con la talla">
        <p>
          Usa nuestra <Link href="/guia-de-tallas" className="font-bold text-ink underline decoration-primary decoration-2 underline-offset-4">guía de tallas</Link>{' '}
          con calculadora por centímetros o escanea la etiqueta de tus zapatos desde la ficha del producto.
        </p>
      </Block>
    </div>
  );
}

function Garantia() {
  const { exchangeWindowHours: hours } = useSiteSettings();
  return (
    <div className="space-y-5">
      <Highlights
        items={[
          { icon: '🔎', title: 'Revisión previa', text: 'Revisamos cada par antes de empacarlo: costuras, suela, pegado y talla.' },
          { icon: '📸', title: 'Fotos antes de enviar', text: 'Si quieres, te mandamos fotos o video de tu par antes de despacharlo.' },
          { icon: '🛡️', title: 'Garantía Brooklyn', text: 'Si llega con defecto de fábrica, te lo cambiamos sin costo.' },
        ]}
      />
      <Block title="¿Qué cubre la garantía?">
        <List
          items={[
            'Defectos de fábrica: despegues, costuras abiertas o fallas de material presentes al recibir.',
            'Producto equivocado: modelo, color o talla distintos a los de tu pedido.',
            'Daños de transporte reportados al recibir el paquete.',
          ]}
        />
      </Block>
      <Block title="¿Qué no cubre?">
        <List
          items={[
            'Desgaste normal por uso.',
            'Daños por mal uso, lavado en lavadora, calor directo o accidentes.',
            `Reclamos reportados después de las ${hours} horas de recibido el pedido.`,
          ]}
        />
      </Block>
      <Block title="¿Cómo la uso?">
        <p>Escríbenos por WhatsApp con tu número de pedido y fotos claras del detalle. Te respondemos y coordinamos la solución.</p>
        <WaButton message="¡Hola Brooklyn Store! 👋 Quiero hacer uso de la garantía de mi pedido. Les envío fotos. 📸" label="Solicitar garantía" />
      </Block>
    </div>
  );
}

function Faqs() {
  const { faqs } = useSiteSettings();
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-border overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-border">
      {faqs.map((f, i) => (
        <div key={f.question}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-7"
            aria-expanded={open === i}
          >
            <span className="text-sm font-extrabold text-ink sm:text-base">{f.question}</span>
            <span
              className={classNames(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-all',
                open === i ? 'rotate-45 bg-ink text-white' : 'bg-cream-alt text-ink',
              )}
            >
              +
            </span>
          </button>
          {open === i && <p className="animate-slideUp px-5 pb-6 text-sm leading-relaxed text-muted sm:px-7">{f.answer}</p>}
        </div>
      ))}
    </div>
  );
}

function QuienesSomos() {
  const { storeName, brands } = useSiteSettings();
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-3xl bg-[#0a0a0a] p-6 text-white ring-1 ring-primary/40 sm:p-10">
        <span className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.3),transparent_70%)]" />
        <p className="relative text-[10px] font-extrabold uppercase tracking-[0.25em] text-primary-light">Nuestra historia</p>
        <p className="relative mt-3 font-display text-2xl leading-snug sm:text-4xl">
          Zapatos que te hacen <span className="text-gold-gradient">sentir top</span>, a un precio que sí puedes pagar.
        </p>
        <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
          {storeName} nació en Ecuador con una idea simple: que comprar zapatos deportivos en línea sea fácil, seguro y con atención de verdad.
          Por eso confirmamos cada pedido por WhatsApp, te asesoramos con la talla y te damos opciones de pago que te den tranquilidad.
        </p>
      </div>
      <Highlights
        items={[
          { icon: '🤝', title: 'Atención real', text: 'Personas que te responden, te asesoran y te acompañan hasta que recibes tu pedido.' },
          { icon: '👟', title: 'Las marcas que amas', text: `${brands.slice(0, 6).join(', ')} y más.` },
          { icon: '💵', title: 'Compra sin miedo', text: 'Pago contra entrega, cambio de talla y garantía en cada compra.' },
        ]}
      />
      <Block title="Nuestro compromiso">
        <List
          items={[
            'Transparencia: lo que ves en las fotos es lo que recibes.',
            'Precios justos y claros, sin letras pequeñas.',
            'Despacho rápido a todo el Ecuador con Servientrega.',
            'Te acompañamos antes, durante y después de tu compra.',
          ]}
        />
      </Block>
    </div>
  );
}

function Autenticidad() {
  return (
    <div className="space-y-5">
      <Block title="Transparencia total">
        <p>
          En Brooklyn Store creemos que la confianza se gana mostrando las cosas como son. Por eso cada modelo se publica con fotos reales y
          descripción clara, y antes de pagar puedes pedirnos por WhatsApp todas las fotos y videos que necesites.
        </p>
      </Block>
      <Highlights
        items={[
          { icon: '📸', title: 'Fotos y videos reales', text: 'Pídenos fotos o video del par exacto que vas a recibir.' },
          { icon: '🔎', title: 'Control de calidad', text: 'Revisamos acabados, costuras, suela y talla antes de despachar.' },
          { icon: '💬', title: 'Resolvemos tus dudas', text: 'Pregúntanos por materiales, horma o diferencias entre modelos.' },
        ]}
      />
      <Block title="Compra con la seguridad de ver antes de pagar">
        <List
          items={[
            'Con pago contra entrega adelantas solo el envío y pagas tus zapatos cuando los tienes en la mano.',
            'Si el producto no coincide con lo que pediste, lo cambiamos sin costo.',
            'Todas las marcas y nombres de modelos pertenecen a sus respectivos dueños y se usan solo como referencia del producto.',
          ]}
        />
        <WaButton message={generalMessage('Quiero ver fotos y videos reales de un modelo antes de comprar. 📸')} label="Pedir fotos y videos" />
      </Block>
    </div>
  );
}

function Contacto() {
  const { whatsappNumber, whatsappCountryCode, footer } = useSiteSettings();
  const phone = whatsappNumber.replace(/\D/g, '').replace(/^0+/, '');
  const socials = [
    { key: 'instagram', label: 'Instagram', url: footer.instagram },
    { key: 'facebook', label: 'Facebook', url: footer.facebook },
    { key: 'tiktok', label: 'TikTok', url: footer.tiktok },
  ].filter((s) => s.url);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <a
          href={whatsappLinkTo(whatsappNumber, generalMessage(), whatsappCountryCode)}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-3xl bg-whatsapp p-6 text-white shadow-soft transition-transform hover:-translate-y-0.5"
        >
          <WhatsAppIcon size={30} />
          <p className="mt-3 text-lg font-black uppercase">WhatsApp</p>
          <p className="text-sm text-white/85">+{whatsappCountryCode} {phone.replace(/^(\d{2})(\d{3})(\d{4})$/, '$1 $2 $3')}</p>
          <p className="mt-3 text-xs font-bold uppercase tracking-wider">La forma más rápida →</p>
        </a>
        {footer.email && (
          <a href={`mailto:${footer.email}`} className="group rounded-3xl bg-[#0a0a0a] p-6 text-white shadow-soft ring-1 ring-primary/40 transition-transform hover:-translate-y-0.5">
            <span className="text-3xl">✉️</span>
            <p className="mt-3 text-lg font-black uppercase">Correo</p>
            <p className="break-all text-sm text-white/80">{footer.email}</p>
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-primary-light">Escríbenos →</p>
          </a>
        )}
      </div>
      <Block title="Información de la tienda">
        <List
          items={[
            'Tienda en línea con envíos a todo el Ecuador.',
            footer.address ? `Dirección: ${footer.address}` : '',
            'Atención por WhatsApp: respondemos lo antes posible, todos los días.',
          ].filter(Boolean)}
        />
      </Block>
      {socials.length > 0 && (
        <Block title="Síguenos">
          <div className="flex flex-wrap gap-2">
            {socials.map((s) => (
              <a
                key={s.key}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-ink px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-primary hover:text-ink"
              >
                {s.label}
              </a>
            ))}
          </div>
        </Block>
      )}
    </div>
  );
}

function Privacidad() {
  const { storeName, footer } = useSiteSettings();
  return (
    <Legal
      sections={[
        {
          title: 'Quiénes somos',
          body: (
            <p>
              {storeName} es una tienda en línea de calzado con operación en Ecuador. Esta política explica cómo tratamos tus datos personales, de
              acuerdo con la Ley Orgánica de Protección de Datos Personales del Ecuador.
            </p>
          ),
        },
        {
          title: 'Qué datos recopilamos',
          body: (
            <p>
              Los que nos das al hacer un pedido: nombre, número de celular, cédula (opcional), dirección, ciudad, provincia, referencias y, si lo
              compartes, tu ubicación. También datos técnicos básicos de navegación para que la tienda funcione (por ejemplo, tu carrito).
            </p>
          ),
        },
        {
          title: 'Para qué los usamos',
          body: (
            <p>
              Solo para procesar y entregar tu pedido, coordinar pagos, cambios y garantías, y comunicarnos contigo por WhatsApp o correo. No
              vendemos ni alquilamos tus datos.
            </p>
          ),
        },
        {
          title: 'Con quién los compartimos',
          body: (
            <p>
              Únicamente con la empresa de envíos (Servientrega) para entregar tu pedido, y con proveedores tecnológicos que nos ayudan a operar la
              tienda (hospedaje y base de datos), bajo medidas de seguridad.
            </p>
          ),
        },
        {
          title: 'Cuánto tiempo los guardamos',
          body: <p>El tiempo necesario para gestionar tu compra, atender garantías y cumplir obligaciones legales y tributarias.</p>,
        },
        {
          title: 'Tus derechos',
          body: (
            <p>
              Puedes pedir acceso, corrección, actualización o eliminación de tus datos, así como oponerte a su uso, escribiéndonos
              {footer.email ? ` a ${footer.email}` : ''} o por WhatsApp.
            </p>
          ),
        },
        {
          title: 'Seguridad',
          body: <p>Aplicamos medidas técnicas y organizativas razonables para proteger tu información contra accesos no autorizados.</p>,
        },
        {
          title: 'Cambios a esta política',
          body: <p>Podemos actualizar esta política. Publicaremos siempre la versión vigente en esta página.</p>,
        },
      ]}
    />
  );
}

function Terminos() {
  const { storeName, exchangeWindowHours: hours, payments } = useSiteSettings();
  return (
    <Legal
      sections={[
        {
          title: 'Aceptación',
          body: <p>Al comprar en {storeName} aceptas estos términos y condiciones. Te recomendamos leerlos antes de confirmar tu pedido.</p>,
        },
        {
          title: 'Productos y precios',
          body: (
            <p>
              Los precios están en dólares de los Estados Unidos e incluyen IVA. Las fotos son referenciales del modelo; los colores pueden
              variar levemente según la pantalla. Los precios y promociones pueden cambiar sin previo aviso y rigen al momento de confirmar el
              pedido.
            </p>
          ),
        },
        {
          title: 'Pedidos',
          body: (
            <p>
              Todo pedido se confirma por WhatsApp. Un pedido se considera confirmado cuando validamos tu pago o, en contra entrega, el adelanto
              del envío. Nos reservamos el derecho de anular pedidos con datos incompletos o falsos.
            </p>
          ),
        },
        {
          title: 'Pagos',
          body: (
            <p>
              Aceptamos transferencia o depósito en Banco Pichincha y pago contra entrega
              {payments.codEnabled ? ` (adelanto de ${formatPrice(payments.codAdvance)} por el envío y el saldo en efectivo al recibir)` : ''}. Solo
              son válidos los pagos a nuestra cuenta oficial mostrada al confirmar tu pedido.
            </p>
          ),
        },
        {
          title: 'Envíos',
          body: (
            <p>
              Enviamos con Servientrega a todo el Ecuador. Los tiempos de entrega son estimados y pueden variar por causas ajenas a nosotros
              (clima, feriados, zonas de difícil acceso). El cliente debe proporcionar una dirección y un número de contacto correctos.
            </p>
          ),
        },
        {
          title: 'Cambios, devoluciones y garantía',
          body: (
            <p>
              Los cambios de talla se solicitan por WhatsApp en un plazo máximo de {hours} horas desde la recepción, con el producto sin uso y en su
              empaque original, sujetos a disponibilidad. Los defectos de fábrica se cambian sin costo según nuestra política de garantía.
            </p>
          ),
        },
        {
          title: 'Pago contra entrega',
          body: (
            <p>
              El adelanto del envío no es reembolsable si el cliente no recibe o rechaza el pedido sin una causa atribuible a la tienda, ya que
              cubre el costo de transporte.
            </p>
          ),
        },
        {
          title: 'Marcas',
          body: <p>Las marcas y nombres comerciales mencionados pertenecen a sus respectivos titulares y se usan solo como referencia.</p>,
        },
        {
          title: 'Legislación',
          body: <p>Estos términos se rigen por las leyes de la República del Ecuador, incluida la Ley Orgánica de Defensa del Consumidor.</p>,
        },
      ]}
    />
  );
}

const PAGES: Record<string, () => JSX.Element> = {
  'rastrear-pedido': RastrearPedido,
  'envios-y-entregas': Envios,
  'metodos-de-pago': MetodosPago,
  'cambios-y-devoluciones': Cambios,
  garantia: Garantia,
  'preguntas-frecuentes': Faqs,
  'quienes-somos': QuienesSomos,
  autenticidad: Autenticidad,
  contacto: Contacto,
  'politica-de-privacidad': Privacidad,
  'terminos-y-condiciones': Terminos,
};

export default function HelpArticle({ slug }: { slug: string }) {
  const Page = PAGES[slug];
  return Page ? <Page /> : null;
}
