export interface ProductColor {
  name: string;
  hex: string;
  image?: string;
}

export interface ProductReview {
  name: string;
  city?: string;
  rating: number;
  text: string;
  date?: string;
}

// Para quién es el modelo — se usa en los filtros del catálogo y para
// en el panel al crear productos.
export const GENDERS = [
  { value: 'hombre', label: 'Hombre' },
  { value: 'mujer', label: 'Mujer' },
  { value: 'unisex', label: 'Unisex' },
] as const;

export type Gender = (typeof GENDERS)[number]['value'];

// Cómo calza la horma comparada con una talla normal — aparece como un
// medidor en la ficha del producto para que el cliente elija bien a la
// primera y no tenga que hacer cambios.
export const FITS = [
  { value: 'pequena', label: 'Horma pequeña', tip: 'Te recomendamos pedir media talla o una talla más.' },
  { value: 'normal', label: 'Horma normal', tip: 'Pide tu talla de siempre.' },
  { value: 'grande', label: 'Horma grande', tip: 'Si estás entre dos tallas, elige la menor.' },
] as const;

export type Fit = (typeof FITS)[number]['value'];

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  gender: Gender;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images: string[];
  sizes: string[];
  colors: ProductColor[];
  collection: string;
  fit: Fit;
  stock: number;
  featured: boolean;
  isNew?: boolean;
  active: boolean;
  soldCount?: number;
  reviewsCount?: number;
  reviews?: ProductReview[];
  createdAt?: number;
  updatedAt?: number;
}

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  brand?: string;
  price: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
}

// Los dos únicos métodos de pago de la tienda. Ambos terminan confirmando
// el pedido por WhatsApp:
//  - transferencia: el cliente paga el total por transferencia o depósito.
//  - contra_entrega: el cliente adelanta solo el valor del envío por
//    transferencia/depósito y paga el resto en efectivo al recibir.
export type PaymentMethod = 'transferencia' | 'contra_entrega';

export type OrderStatus = 'pendiente' | 'confirmado' | 'enviado' | 'entregado' | 'cancelado';

export interface OrderCustomer {
  name: string;
  phone: string;
  cedula?: string;
  address: string;
  reference?: string;
  city: string;
  province: string;
  note?: string;
  locationUrl?: string;
}

export const CARRIERS = [
  'Servientrega',
  'Tramaco Express',
  'Laar Courier',
  'Urbano Express',
  'Gintracom',
  'Motorizado propio',
  'Otra',
] as const;

export type Carrier = (typeof CARRIERS)[number];

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  discount?: number;
  shipping: number;
  total: number;
  // Lo que el cliente paga ANTES del despacho (todo en transferencia, solo
  // el envío en contra entrega) y lo que paga al recibir.
  payNow: number;
  payOnDelivery: number;
  customer: OrderCustomer;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  carrier?: Carrier;
  trackingNumber?: string;
  couponCode?: string;
  createdAt: number;
}

export type OrderInput = Omit<Order, 'id' | 'createdAt' | 'orderNumber'>;

export interface TrustItem {
  icon: string;
  title: string;
  sub: string;
}

export interface BenefitItem {
  icon: string;
  title: string;
  text: string;
}

export interface TestimonialItem {
  name: string;
  city: string;
  review: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ProvinceRate {
  province: string;
  rate: number;
}

export interface ShippingSettings {
  // Costo de envío cuando el cliente paga por transferencia. En 0 = gratis.
  defaultRate: number;
  rates: ProvinceRate[];
  deliveryTime: string;
}

export interface BankAccount {
  bank: string;
  type: string;
  number: string;
  holder: string;
  idNumber: string;
}

export interface PaymentSettings {
  // Valor del envío que se adelanta en el pago contra entrega.
  codAdvance: number;
  codEnabled: boolean;
  bankAccounts: BankAccount[];
  transferNote: string;
}

// Marca estrella: la que más vende la tienda. Se destaca con un bloque
// premium en el inicio, primera en el menú de marcas, en la cinta de marcas,
// con insignia en sus productos y con portada propia en el catálogo.
export interface FeaturedBrand {
  enabled: boolean;
  name: string;
  eyebrow: string;
  heading: string;
  text: string;
  image: string;
  badge: string;
  bullets: string[];
  buttonText: string;
}

export interface SiteColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  cream: string;
  creamAlt: string;
  ink: string;
  muted: string;
  border: string;
}

export interface CollectionMenuItem {
  label: string;
  value: string;
}

export interface SiteSettings {
  storeName: string;
  logoUrl: string;
  logoHeight: number;
  whatsappCountryCode: string;
  whatsappNumber: string;
  notificationEmail: string;
  collectionsMenu: CollectionMenuItem[];
  brands: string[];
  featuredBrand: FeaturedBrand;
  colors: SiteColors;
  fonts: {
    headingFont: string;
    bodyFont: string;
  };
  announcementMessages: string[];
  hero: {
    eyebrow: string;
    heading: string;
    subtext: string;
    images: string[];
    badge1: string;
    badge2: string;
    badge3: string;
    button1Text: string;
    button1Url: string;
    button2Text: string;
    button2Url: string;
    titleSize: 'sm' | 'md' | 'lg' | 'xl';
    subtextSize: 'sm' | 'md' | 'lg';
  };
  shipping: ShippingSettings;
  payments: PaymentSettings;
  trustItems: TrustItem[];
  benefitsHeading: string;
  benefits: BenefitItem[];
  testimonialsHeading: string;
  testimonialsSubtext: string;
  testimonials: TestimonialItem[];
  faqs: FaqItem[];
  cta: {
    eyebrow: string;
    heading: string;
    text: string;
    buttonText: string;
    buttonUrl: string;
  };
  footer: {
    brandText: string;
    contactText: string;
    email: string;
    address: string;
    instagram: string;
    facebook: string;
    tiktok: string;
    copyrightText: string;
  };
}
