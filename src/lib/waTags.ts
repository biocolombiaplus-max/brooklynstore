// Etiquetas de los mensajes que salen de la tienda hacia WhatsApp.
//
// Cada mensaje empieza con una etiqueta fija (#BSPedido, #BSTalla...) para
// ubicar los chats al instante en WhatsApp Business: se ve en la lista de
// chats y se encuentra con el buscador. "BS" (Brooklyn Store) evita que se
// confunda con lo que escriben los clientes.
export const WA_TAGS = {
  pedido: '#BSPedido',
  pago: '#BSPago',
  carrito: '#BSCarrito',
  producto: '#BSProducto',
  agotado: '#BSAgotado',
  talla: '#BSTalla',
  cambio: '#BSCambio',
  asesoria: '#BSAsesoria',
  catalogo: '#BSCatalogo',
  info: '#BSInfo',
  ayuda: '#BSAyuda',
} as const;

export type WaTag = (typeof WA_TAGS)[keyof typeof WA_TAGS];

// Antepone la etiqueta (y un detalle opcional, ej. el n.º de pedido). Si el
// mensaje ya trae una etiqueta, se deja igual.
export function withTag(tag: WaTag, message: string, detail?: string): string {
  if (message.startsWith('#BS')) return message;
  return `${tag}${detail ? ` · ${detail}` : ''}\n${message}`;
}

// Guía para el panel: qué significa cada etiqueta.
export const WA_TAG_GUIDE: { tag: WaTag; label: string; when: string }[] = [
  { tag: WA_TAGS.pedido, label: 'Pedido web', when: 'Tocó "Pedir por WhatsApp" (trae número de pedido y fotos)' },
  { tag: WA_TAGS.carrito, label: 'Carrito', when: 'Pidió todo su carrito por WhatsApp' },
  { tag: WA_TAGS.pago, label: 'Pago enviado', when: 'Avisa que ya pagó y envía el comprobante' },
  { tag: WA_TAGS.producto, label: 'Pregunta por un zapato', when: 'Consulta desde la ficha de un producto' },
  { tag: WA_TAGS.agotado, label: 'Agotado', when: 'Quiere que le avises cuando llegue' },
  { tag: WA_TAGS.talla, label: 'Ayuda con talla', when: 'No sabe su talla' },
  { tag: WA_TAGS.cambio, label: 'Cambio de talla', when: 'Solicita un cambio' },
  { tag: WA_TAGS.asesoria, label: 'Asesoría', when: 'Pide ayuda para elegir' },
  { tag: WA_TAGS.catalogo, label: 'Catálogo', when: 'Quiere ver modelos disponibles' },
  { tag: WA_TAGS.info, label: 'Información', when: 'Botón general de WhatsApp' },
  { tag: WA_TAGS.ayuda, label: 'Centro de ayuda', when: 'Escribe desde una página de ayuda' },
];
