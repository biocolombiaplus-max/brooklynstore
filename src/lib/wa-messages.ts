'use client';

import { create } from 'zustand';
import { formatPrice } from './utils';

// Mensajes de WhatsApp personalizados según desde dónde escribe el cliente,
// para que la tienda sepa de inmediato qué necesita y pueda responder rápido.

const HELLO = '¡Hola Brooklyn Store! 👋';

function pageUrl(): string {
  return typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
}

export function generalMessage(topic = 'Quiero información sobre sus zapatos.'): string {
  return `${HELLO}\n${topic}`;
}

export function catalogMessage(): string {
  return `${HELLO}\nQuiero ver el catálogo y los modelos disponibles. ¿Me ayudan? 👟`;
}

export function adviceMessage(): string {
  return `${HELLO}\nQuiero asesoría para elegir mis zapatos 👟\n\n• Para: (hombre / mujer)\n• Uso: (diario / correr / gym / formal)\n• Mi talla: \n• Presupuesto aprox.: `;
}

export function sizeHelpMessage(): string {
  return `${HELLO}\nNecesito ayuda con mi talla 📏\n\n• Largo de mi pie: ___ cm\n• Modelo que me interesa: \n• Talla que uso normalmente: `;
}

export function exchangeMessage(hours = 48): string {
  return `${HELLO}\nQuiero solicitar un *cambio de talla* 🔄 (dentro de las ${hours} h de recibido)\n\n• N.º de pedido: \n• Modelo: \n• Talla que recibí: \n• Talla que necesito: \n• Fecha en que lo recibí: \n\nTe envío fotos del zapato sin uso y con su caja. 📸`;
}

export function brandMessage(brand: string): string {
  return `${HELLO}\nMe interesan los zapatos *${brand}* ⭐ ¿Qué modelos y tallas tienen disponibles?\n\n${pageUrl()}`;
}

export function filteredCatalogMessage(filters: string[]): string {
  const detail = filters.length ? `\nEstoy buscando: ${filters.join(' · ')}` : '';
  return `${HELLO}\nQuiero ver modelos disponibles.${detail}\n\n${pageUrl()}`;
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app').replace(/\/$/, '');

export function productMessage(
  p: { title: string; slug: string; brand?: string; price: number; size?: string; color?: string },
  extra?: string,
): string {
  const lines = [
    `🛍️ *${p.title}*${p.brand ? ` (${p.brand})` : ''}`,
    `💲 Precio: ${formatPrice(p.price)}`,
    p.size ? `📏 Talla: ${p.size}` : '📏 Talla: (por confirmar)',
    p.color ? `🎨 Color: ${p.color}` : '',
  ].filter(Boolean);
  return `${HELLO}\nMe interesa este modelo:\n\n${lines.join('\n')}\n\n${extra ?? '¿Está disponible? 🙌'}\n${SITE_URL}/producto/${p.slug}`;
}

// La ficha de producto guarda aquí el modelo que el cliente está viendo,
// para que el botón flotante de WhatsApp también mande ese mensaje.
interface WaContextState {
  message: string | null;
  setMessage: (message: string | null) => void;
}

export const useWaContext = create<WaContextState>((set) => ({
  message: null,
  setMessage: (message) => set({ message }),
}));
