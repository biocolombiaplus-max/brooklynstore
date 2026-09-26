// Páginas del Centro de ayuda (footer, menú lateral y /ayuda).
export interface HelpPage {
  slug: string;
  title: string;
  icon: string;
  description: string;
  group: 'compra' | 'empresa' | 'legal';
}

export const HELP_PAGES: HelpPage[] = [
  { slug: 'rastrear-pedido', title: 'Rastrear pedido', icon: '📦', description: 'Consulta dónde está tu pedido y tu guía Servientrega.', group: 'compra' },
  { slug: 'envios-y-entregas', title: 'Envíos y entregas', icon: '🚚', description: 'Tiempos, costos y cobertura a todo el Ecuador.', group: 'compra' },
  { slug: 'metodos-de-pago', title: 'Métodos de pago', icon: '💳', description: 'Transferencia, depósito y pago contra entrega.', group: 'compra' },
  { slug: 'cambios-y-devoluciones', title: 'Cambios y devoluciones', icon: '🔄', description: 'Cambio de talla y cómo solicitarlo paso a paso.', group: 'compra' },
  { slug: 'garantia', title: 'Garantía', icon: '🛡️', description: 'Qué cubre la Garantía Brooklyn y cómo usarla.', group: 'compra' },
  { slug: 'preguntas-frecuentes', title: 'Preguntas frecuentes', icon: '❓', description: 'Las dudas más comunes, resueltas.', group: 'compra' },
  { slug: 'quienes-somos', title: 'Quiénes somos', icon: '✨', description: 'La historia y el compromiso de Brooklyn Store.', group: 'empresa' },
  { slug: 'autenticidad', title: 'Autenticidad', icon: '🔍', description: 'Transparencia total sobre lo que compras.', group: 'empresa' },
  { slug: 'contacto', title: 'Contacto', icon: '💬', description: 'WhatsApp, correo y redes sociales.', group: 'empresa' },
  { slug: 'politica-de-privacidad', title: 'Política de privacidad', icon: '🔒', description: 'Cómo cuidamos tus datos personales.', group: 'legal' },
  { slug: 'terminos-y-condiciones', title: 'Términos y condiciones', icon: '📄', description: 'Las reglas claras de compra en la tienda.', group: 'legal' },
];

export const HELP_GROUPS: { key: HelpPage['group']; label: string }[] = [
  { key: 'compra', label: 'Tu compra' },
  { key: 'empresa', label: 'Brooklyn Store' },
  { key: 'legal', label: 'Legal' },
];

export function helpPage(slug: string): HelpPage | undefined {
  return HELP_PAGES.find((p) => p.slug === slug);
}

export const HELP_UPDATED = 'septiembre de 2026';
