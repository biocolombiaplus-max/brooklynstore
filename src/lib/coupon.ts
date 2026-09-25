const STORAGE_KEY = 'brooklyn-coupon';
const VALID_HOURS = 24;

export interface WonCoupon {
  code: string;
  percent: number;
  expiresAt: number;
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

export function saveWonCoupon(code: string, percent: number): void {
  if (typeof window === 'undefined') return;
  const coupon: WonCoupon = { code, percent, expiresAt: Date.now() + VALID_HOURS * 60 * 60 * 1000 };
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
