import type { PaymentMethod } from './types';

const STORAGE_KEY = 'brooklyn-coupon';
const VALID_HOURS = 24;

export interface WonCoupon {
  code: string;
  percent: number;
  expiresAt: number;
  // Si el cupón solo vale con un método de pago (ej. el 10% de fidelización
  // solo pagando por transferencia).
  onlyMethod?: PaymentMethod;
  // Cupón personal de fidelización (se marca como usado al comprar).
  loyalty?: boolean;
}

// Porcentaje que aplica según el método de pago elegido.
export function couponPercentFor(coupon: WonCoupon | null, method: PaymentMethod): number {
  if (!coupon) return 0;
  if (coupon.onlyMethod && coupon.onlyMethod !== method) return 0;
  return coupon.percent;
}

// Valida un código: primero los fijos y luego los personales de
// fidelización (GRACIAS-...). Lo guarda como cupón activo si es válido.
export async function redeemAnyCouponCode(rawCode: string): Promise<{ coupon: WonCoupon | null; error?: string }> {
  const fixed = redeemCouponCode(rawCode);
  if (fixed) return { coupon: fixed };
  const code = rawCode.trim().toUpperCase();
  if (!code) return { coupon: null };
  try {
    const { getLoyalty } = await import('./loyalty');
    const record = await getLoyalty(code);
    if (!record) return { coupon: null, error: 'Ese cupón no es válido.' };
    if (record.couponUsed) return { coupon: null, error: 'Ese cupón ya fue usado.' };
    if (record.couponExpiresAt < Date.now()) return { coupon: null, error: 'Ese cupón ya venció.' };
    saveWonCoupon(record.code, record.couponPercent, record.couponExpiresAt, record.couponMethod, true);
    return { coupon: getActiveCoupon() };
  } catch {
    return { coupon: null, error: 'No pudimos validar el cupón. Revisa tu conexión e intenta de nuevo.' };
  }
}

// Códigos válidos — los mismos que reparte la ruleta de descuentos
// (SpinWheel), pero también se pueden escribir a mano en el checkout (por
// ejemplo si la clienta lo recibió por WhatsApp o redes sociales).
export const COUPON_CODES: Record<string, number> = {
  BROOKLYN5: 5,
};

// Valida un código escrito a mano y, si es válido, lo guarda como el cupón
// activo (igual que si se hubiera ganado en la ruleta). Devuelve el cupón
// guardado, o null si el código no existe.
export function redeemCouponCode(rawCode: string): WonCoupon | null {
  const code = rawCode.trim().toUpperCase();
  const percent = COUPON_CODES[code];
  if (!percent) return null;
  saveWonCoupon(code, percent);
  return getActiveCoupon();
}

export function saveWonCoupon(code: string, percent: number, expiresAt?: number, onlyMethod?: PaymentMethod, loyalty?: boolean): void {
  if (typeof window === 'undefined') return;
  const coupon: WonCoupon = {
    code,
    percent,
    expiresAt: expiresAt ?? Date.now() + VALID_HOURS * 60 * 60 * 1000,
    ...(onlyMethod ? { onlyMethod } : {}),
    ...(loyalty ? { loyalty } : {}),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupon));
  } catch {
    // Almacenamiento no disponible (modo privado, etc.) — el cupón simplemente no persiste.
  }
}

export function getActiveCoupon(): WonCoupon | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const coupon = JSON.parse(raw) as WonCoupon;
    if (!coupon?.code || !coupon.percent || coupon.expiresAt < Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return coupon;
  } catch {
    return null;
  }
}

export function clearCoupon(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que limpiar si el almacenamiento no está disponible.
  }
}
