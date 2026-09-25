import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { SiteSettings } from './types';

const DOC_PATH = { collection: 'settings', id: 'site' } as const;

export const DEFAULT_SETTINGS: SiteSettings = {
  storeName: process.env.NEXT_PUBLIC_STORE_NAME || 'Brooklyn Store',
  // El logo dorado de Brooklyn Store viene incluido en /public — desde el
  // panel se puede reemplazar por otro subido a Cloudinary.
  logoUrl: '/logo.png',
  logoHeight: 56,
  whatsappCountryCode: process.env.NEXT_PUBLIC_WHATSAPP_COUNTRY_CODE || '593',
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '',
  notificationEmail: process.env.NEXT_PUBLIC_NOTIFICATION_EMAIL || '',
  collectionsMenu: [
    { label: 'Deportivos', value: 'deportivos' },
    { label: 'Urbanos / Casual', value: 'urbanos' },
    { label: 'Running', value: 'running' },
    { label: 'Formales', value: 'formales' },
  ],
  brands: ['Nike', 'Adidas', 'New Balance', 'Puma', 'Converse', 'Vans', 'Reebok', 'Asics'],
  colors: {
    primary: '#B8923A',
    primaryHover: '#96742A',
    primaryLight: '#D9BE72',
    cream: '#FFFFFF',
    creamAlt: '#F6F2EA',
    ink: '#0E0E0E',
    muted: '#6E6759',
    border: '#E7E1D4',
  },
  fonts: {
    headingFont: 'Montserrat',
    bodyFont: 'Montserrat',
  },
  announcementMessages: [
    '🚚 Envíos a todito el Ecuador — llegamos a tu puerta',
    '💵 Pago contra entrega: solo adelantas $5 del envío y el resto al recibir',
    '🏦 Paga por transferencia o depósito — Pichincha, Guayaquil, Produbanco y más',
    '✅ 100% originales · Garantía Brooklyn',
    '🔄 ¿No te quedó? Cambio de talla sin complicaciones',
    '⚡ Pilas: los más vendidos se agotan ya mismo',
  ],
  hero: {
    eyebrow: 'Nueva colección 2026',
    heading: 'Los zapatos que buscas, al precio que te gusta',
    subtext:
      'Nike, Adidas, New Balance y más marcas top, con envío a todo el Ecuador. Pagas por transferencia o contra entrega — full fácil y seguro.',
    images: [
      'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1400&q=80',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1400&q=80',
    ],
    badge1: '🚚 Envío a todo Ecuador',
    badge2: '💵 Contra entrega',
    badge3: '✅ 100% originales',
    button1Text: 'Comprar ahora',
    button1Url: '/catalogo',
    button2Text: 'Ver ofertas',
    button2Url: '/catalogo?ofertas=1',
    titleSize: 'lg',
    subtextSize: 'md',
  },
  shipping: {
    // Pagando por transferencia el envío es GRATIS por defecto en todo el
    // país; solo se cobra en las provincias que se agreguen en el panel.
    defaultRate: 0,
    rates: [{ province: 'Galápagos', rate: 15 }],
    deliveryTime: '24 a 72 horas hábiles',
  },
  payments: {
    codAdvance: 5,
    codEnabled: true,
    bankAccounts: [
      {
        bank: 'Banco Pichincha',
        type: 'Cuenta de ahorros',
        number: '0000000000',
        holder: 'Brooklyn Store',
        idNumber: '0000000000',
      },
    ],
    transferNote: 'Envíanos la foto del comprobante por WhatsApp y despachamos tu pedido ese mismo día.',
  },
  trustItems: [
    { icon: '🚚', title: 'Envío a todo Ecuador', sub: 'De Tulcán a Zamora' },
    { icon: '💵', title: 'Contra entrega', sub: 'Adelantas solo $5' },
    { icon: '🏦', title: 'Transferencia', sub: 'Envío gratis' },
    { icon: '✅', title: '100% originales', sub: 'Garantía Brooklyn' },
    { icon: '🔄', title: 'Cambio de talla', sub: 'Sin complicaciones' },
  ],
  benefitsHeading: '¿Por qué comprar en Brooklyn Store?',
  benefits: [
    {
      icon: '✅',
      title: 'Marcas originales',
      text: 'Trabajamos solo con producto original. Si no es original, te devolvemos tu plata. Así de claro.',
    },
    {
      icon: '💵',
      title: 'Pagas al recibir',
      text: 'Con contra entrega solo adelantas $5 del envío y el resto lo pagas cuando tienes tus zapatos en la mano.',
    },
    {
      icon: '📏',
      title: 'Tu talla, a la primera',
      text: 'Guía de tallas súper clara y asesoría por WhatsApp. ¿No te quedó? Te lo cambiamos sin drama.',
    },
    {
      icon: '⚡',
      title: 'Despacho ya mismo',
      text: 'Confirmas por WhatsApp y despachamos el mismo día. Llega en 24 a 72 horas a todo el país.',
    },
  ],
  testimonialsHeading: 'Lo que dicen nuestros clientes',
  testimonialsSubtext: 'Clientes reales de todo el Ecuador que ya estrenaron con Brooklyn',
  testimonials: [
    {
      name: 'Andrés M.',
      city: 'Quito',
      review:
        'Full recomendados, ñaño. Pedí unas Air Force por contra entrega, adelanté los $5 y me llegaron en dos días. Originales y con su caja. De una vuelvo a comprar.',
    },
    {
      name: 'Gabriela V.',
      city: 'Guayaquil',
      review:
        'Súper bacán la atención por WhatsApp. Me ayudaron con la talla y me quedaron perfectas. Pagué por transferencia y el envío fue gratis.',
    },
    {
      name: 'Daniel C.',
      city: 'Cuenca',
      review:
        'Tenía miedo de comprar en línea, pero con el pago al recibir me dio confianza. Las Samba están chévere, tal cual las fotos.',
    },
    {
      name: 'María José P.',
      city: 'Manta',
      review: 'Rápidos y serios. Me mandaron la guía de Servientrega al toque y llegó a la casa. 10 de 10.',
    },
  ],
  faqs: [
    {
      question: '¿Cómo funciona el pago contra entrega?',
      answer:
        'Adelantas solo $5 por transferencia o depósito, que cubren el envío. El resto lo pagas en efectivo cuando el courier te entrega tus zapatos en la dirección que nos diste. Así los dos quedamos tranquilos.',
    },
    {
      question: '¿Cómo pago por transferencia o depósito?',
      answer:
        'Al confirmar tu pedido te mostramos nuestras cuentas bancarias. Haces la transferencia o el depósito en ventanilla / agente, nos mandas la foto del comprobante por WhatsApp y despachamos ese mismo día. ¡Y el envío te sale gratis!',
    },
    {
      question: '¿Los zapatos son originales?',
      answer:
        'Sí, 100% originales. Trabajamos solo con producto original y te lo garantizamos. Si no es original, te devolvemos tu dinero.',
    },
    {
      question: '¿Cuánto se demora en llegar?',
      answer:
        'Despachamos el mismo día que confirmas. En ciudades principales (Quito, Guayaquil, Cuenca, Ambato, Manta...) llega en 24 a 48 horas; en el resto del país, de 48 a 72 horas hábiles.',
    },
    {
      question: '¿Y si no me queda la talla?',
      answer:
        'Tranquilo. Tienes 7 días para pedir el cambio de talla, siempre que el zapato esté sin uso y con su caja. Escríbenos por WhatsApp y lo coordinamos.',
    },
    {
      question: '¿Cómo sé cuál es mi talla?',
      answer:
        'En cada producto tienes el botón "¿Cuál es mi talla?": mides tu pie en centímetros y te decimos la talla exacta. Además te indicamos si el modelo calza pequeño, normal o grande.',
    },
  ],
  cta: {
    eyebrow: '¿Qué esperas, pana?',
    heading: 'Estrena hoy. Paga al recibir.',
    text: 'Elige tus zapatos, confirma por WhatsApp y te llegan a la puerta de tu casa en cualquier rincón del Ecuador.',
    buttonText: 'Ir al catálogo',
    buttonUrl: '/catalogo',
  },
  footer: {
    brandText:
      'Tienda multimarca de zapatos originales en Ecuador. Nike, Adidas, New Balance, Puma y más, con envío a todo el país.',
    contactText: '¿Dudas con tu talla o tu pedido? Escríbenos, te respondemos ya mismo.',
    address: 'Ecuador',
    instagram: '',
    facebook: '',
    tiktok: '',
    copyrightText: '',
  },
};

export function mergeWithDefaults(data: Partial<SiteSettings> | undefined): SiteSettings {
  if (!data) return DEFAULT_SETTINGS;
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    colors: { ...DEFAULT_SETTINGS.colors, ...data.colors },
    fonts: { ...DEFAULT_SETTINGS.fonts, ...data.fonts },
    hero: {
      ...DEFAULT_SETTINGS.hero,
      ...data.hero,
      images: data.hero?.images?.length ? data.hero.images : DEFAULT_SETTINGS.hero.images,
    },
    cta: { ...DEFAULT_SETTINGS.cta, ...data.cta },
    footer: { ...DEFAULT_SETTINGS.footer, ...data.footer },
    shipping: {
      ...DEFAULT_SETTINGS.shipping,
      ...data.shipping,
      rates: data.shipping?.rates ?? DEFAULT_SETTINGS.shipping.rates,
    },
    payments: {
      ...DEFAULT_SETTINGS.payments,
      ...data.payments,
      bankAccounts: data.payments?.bankAccounts?.length
        ? data.payments.bankAccounts
        : DEFAULT_SETTINGS.payments.bankAccounts,
    },
    logoUrl: data.logoUrl || DEFAULT_SETTINGS.logoUrl,
    logoHeight: data.logoHeight ?? DEFAULT_SETTINGS.logoHeight,
    collectionsMenu: data.collectionsMenu ?? DEFAULT_SETTINGS.collectionsMenu,
    brands: data.brands?.length ? data.brands : DEFAULT_SETTINGS.brands,
    announcementMessages: data.announcementMessages?.length ? data.announcementMessages : DEFAULT_SETTINGS.announcementMessages,
    trustItems: data.trustItems?.length ? data.trustItems : DEFAULT_SETTINGS.trustItems,
    benefits: data.benefits?.length ? data.benefits : DEFAULT_SETTINGS.benefits,
    testimonials: data.testimonials?.length ? data.testimonials : DEFAULT_SETTINGS.testimonials,
    faqs: data.faqs?.length ? data.faqs : DEFAULT_SETTINGS.faqs,
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!db) return DEFAULT_SETTINGS;
  try {
    const ref = doc(db, DOC_PATH.collection, DOC_PATH.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_SETTINGS;
    return mergeWithDefaults(snap.data() as Partial<SiteSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateSiteSettings(settings: SiteSettings): Promise<void> {
  const ref = doc(db, DOC_PATH.collection, DOC_PATH.id);
  await setDoc(ref, settings, { merge: true });
}
