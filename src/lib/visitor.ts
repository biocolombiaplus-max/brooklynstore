'use client';

import type { CartItem, VisitorCartItem, VisitorProduct, VisitorStage } from './types';

// Seguimiento de visitantes (como el "En vivo" de Shopify): de dónde
// llegan, qué zapatos ven, si llegan al carrito o al pago y si compran.
// El perfil vive en el navegador y se envía a /api/track, que agrega la
// ciudad y lo guarda para el panel. Nunca bloquea ni rompe la tienda.

const VID_KEY = 'bs-vid';
const PROFILE_KEY = 'bs-visitor';
const SESSION_KEY = 'bs-visit-session';

const RANK: Record<VisitorStage, number> = { visita: 0, producto: 1, carrito: 2, checkout: 3, compra: 4 };

interface Profile {
  firstSeen: number;
  visits: number;
  landing: string;
  source: string;
  campaign: string;
  device: string;
  products: VisitorProduct[];
  cart: VisitorCartItem[];
  cartValue: number;
  stage: VisitorStage;
  stageAt: number;
  name: string;
  phone: string;
  orderNumber: string;
}

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function visitorId(): string {
  const s = storage();
  let vid = s?.getItem(VID_KEY) ?? '';
  if (!/^[a-f0-9]{24}$/.test(vid)) {
    vid = randomId();
    s?.setItem(VID_KEY, vid);
  }
  return vid;
}

function loadProfile(): Profile {
  const empty: Profile = {
    firstSeen: Date.now(),
    visits: 0,
    landing: '',
    source: 'Directo',
    campaign: '',
    device: '',
    products: [],
    cart: [],
    cartValue: 0,
    stage: 'visita',
    stageAt: Date.now(),
    name: '',
    phone: '',
    orderNumber: '',
  };
  try {
    return { ...empty, ...JSON.parse(storage()?.getItem(PROFILE_KEY) ?? '{}') };
  } catch {
    return empty;
  }
}

function saveProfile(p: Profile) {
  try {
    storage()?.setItem(PROFILE_KEY, JSON.stringify(p));
  } catch {
    /* sin almacenamiento */
  }
}

// Celulares del equipo (quien entra al panel admin): sus visitas no se
// cuentan, para que las estadísticas sean solo de clientes reales.
export const STAFF_KEY = 'bs-staff-device';

export function isStaffDevice(): boolean {
  try {
    return window.localStorage.getItem(STAFF_KEY) === '1';
  } catch {
    return false;
  }
}

function isBot(): boolean {
  return (
    typeof navigator === 'undefined' ||
    navigator.webdriver ||
    /bot|crawler|spider|facebookexternalhit|preview/i.test(navigator.userAgent) ||
    isStaffDevice()
  );
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPod/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android' : 'Tablet Android';
  if (/Mac OS X/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return 'Computador';
}

// De dónde llegó en esta visita (anuncio, Instagram, Google, WhatsApp...).
function detectSource(): { source: string; campaign: string } {
  const params = new URLSearchParams(window.location.search);
  const utm = (params.get('utm_source') ?? '').toLowerCase();
  const medium = (params.get('utm_medium') ?? '').toLowerCase();
  const campaign = [params.get('utm_campaign'), params.get('utm_content')].filter(Boolean).join(' · ').slice(0, 120);
  const paid = /paid|cpc|ads|catalogo/.test(medium);
  if (utm) {
    if (/^(fb|facebook|meta)/.test(utm)) return { source: paid ? 'Meta Ads' : 'Facebook', campaign };
    if (/^(ig|instagram)/.test(utm)) return { source: paid ? 'Meta Ads' : 'Instagram', campaign };
    if (/google/.test(utm)) return { source: paid ? 'Google Ads' : 'Google', campaign };
    if (/whatsapp|wa/.test(utm)) return { source: 'WhatsApp', campaign };
    if (/tiktok/.test(utm)) return { source: 'TikTok', campaign };
    return { source: utm.slice(0, 40), campaign };
  }
  if (params.get('fbclid')) return { source: 'Facebook / Instagram', campaign };
  if (params.get('gclid')) return { source: 'Google Ads', campaign };
  let host = '';
  try {
    host = document.referrer ? new URL(document.referrer).hostname : '';
  } catch {
    host = '';
  }
  if (!host || host === window.location.hostname) return { source: 'Directo', campaign };
  if (/facebook|fb\./.test(host)) return { source: 'Facebook', campaign };
  if (/instagram/.test(host)) return { source: 'Instagram', campaign };
  if (/google/.test(host)) return { source: 'Google', campaign };
  if (/whatsapp|wa\.me/.test(host)) return { source: 'WhatsApp', campaign };
  if (/tiktok/.test(host)) return { source: 'TikTok', campaign };
  return { source: host.replace(/^www\./, '').slice(0, 40), campaign };
}

let pending: ReturnType<typeof setTimeout> | null = null;
let pendingPageview = false;

function send(profile: Profile, opts: { pageview?: boolean; immediate?: boolean } = {}) {
  if (isBot()) return;
  if (opts.pageview) pendingPageview = true;
  if (pending) clearTimeout(pending);
  const fire = () => {
    pending = null;
    const pageview = pendingPageview;
    pendingPageview = false;
    const body = JSON.stringify({ vid: visitorId(), pageview, path: window.location.pathname, data: profile });
    fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  };
  if (opts.immediate) fire();
  else pending = setTimeout(fire, 700);
}

function update(mutator: (p: Profile) => void, opts?: { pageview?: boolean; immediate?: boolean }) {
  if (typeof window === 'undefined' || isBot()) return;
  const p = loadProfile();
  mutator(p);
  saveProfile(p);
  send(p, opts);
}

function raise(p: Profile, stage: VisitorStage) {
  if (RANK[stage] > RANK[p.stage] || p.stage === 'compra') {
    p.stage = stage;
    p.stageAt = Date.now();
  }
}

// Cada página vista. La primera de cada visita registra el origen.
export function trackPageview() {
  update(
    (p) => {
      let newSession = false;
      try {
        newSession = !window.sessionStorage.getItem(SESSION_KEY);
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        newSession = false;
      }
      if (newSession) {
        const { source, campaign } = detectSource();
        p.visits += 1;
        p.source = source;
        p.campaign = campaign;
        p.landing = window.location.pathname.slice(0, 120);
        p.device = detectDevice();
      }
    },
    { pageview: true },
  );
}

export function trackVisitorProduct(product: { slug: string; title: string; images: string[] }) {
  update((p) => {
    const item = { slug: product.slug, title: product.title.slice(0, 120), image: product.images[0] ?? '' };
    p.products = [item, ...p.products.filter((x) => x.slug !== item.slug)].slice(0, 6);
    raise(p, 'producto');
  });
}

function toVisitorCart(items: CartItem[]): VisitorCartItem[] {
  return items.slice(0, 15).map((i) => ({
      productId: i.productId,
      slug: i.slug,
      title: i.title.slice(0, 120),
      image: i.image,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.price,
      ...(i.sizeUs ? { sizeUs: i.sizeUs } : {}),
      ...(i.codPrice ? { codPrice: i.codPrice } : {}),
      ...(i.brand ? { brand: i.brand } : {}),
      ...(i.metaId ? { metaId: i.metaId } : {}),
  }));
}

export function trackVisitorCart(items: CartItem[]) {
  update((p) => {
    p.cart = toVisitorCart(items);
    p.cartValue = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
    if (items.length > 0) raise(p, 'carrito');
  });
}

// Formulario de pago abierto (página de pago o compra rápida desde la
// ficha): se guardan los zapatos que está comprando, así si no termina
// aparece en "Carritos abandonados" con su pedido.
export function trackVisitorCheckoutItems(items: CartItem[]) {
  if (!items.length) return;
  update(
    (p) => {
      p.cart = toVisitorCart(items);
      p.cartValue = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
      raise(p, 'checkout');
    },
    { immediate: true },
  );
}

export function trackVisitorCheckout() {
  update((p) => raise(p, 'checkout'), { immediate: true });
}

// Nombre y celular apenas los escribe en el checkout: así se puede ayudar
// por WhatsApp a quien no terminó su compra.
export function trackVisitorContact(name: string, phone: string) {
  update((p) => {
    p.name = name.trim().slice(0, 80);
    p.phone = phone.replace(/[^\d+]/g, '').slice(0, 20);
    raise(p, 'checkout');
  });
}

export function trackVisitorPurchase(orderNumber: string) {
  update(
    (p) => {
      p.orderNumber = orderNumber;
      p.stage = 'compra';
      p.stageAt = Date.now();
      p.cart = [];
      p.cartValue = 0;
    },
    { immediate: true },
  );
}
