// Celulares de Ecuador: +593 9X XXX XXXX. Se guardan como "09XXXXXXXX".

// Deja solo los 9 dígitos nacionales (quita +593, 593 o el 0 inicial).
export function ecNational(raw: string): string {
  let d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('593')) d = d.slice(3);
  d = d.replace(/^0+/, '');
  return d.slice(0, 9);
}

export const isEcMobile = (national: string): boolean => /^9\d{8}$/.test(national);

// "991234567" → "0991234567"
export const ecLocal = (national: string): string => (national ? `0${national}` : '');

// "991234567" → "99 123 4567"
export function formatEcNational(national: string): string {
  const d = national.slice(0, 9);
  return [d.slice(0, 2), d.slice(2, 5), d.slice(5, 9)].filter(Boolean).join(' ');
}

// El WhatsApp del cliente queda guardado en su teléfono (aparte del
// seguimiento de visitas) para no volver a pedírselo en la próxima compra.
const PHONE_KEY = 'bs-wa-phone';

export function rememberPhone(national: string): void {
  try {
    if (isEcMobile(national)) window.localStorage.setItem(PHONE_KEY, national);
  } catch {
    /* sin almacenamiento */
  }
}

export function savedPhone(fallback = ''): string {
  try {
    const stored = window.localStorage.getItem(PHONE_KEY);
    if (stored && isEcMobile(stored)) return stored;
  } catch {
    /* sin almacenamiento */
  }
  return ecNational(fallback);
}
