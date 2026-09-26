// Tablas de equivalencia de tallas, una para hombre y otra para mujer. La
// talla "EC" es la que usamos en toda la tienda.
// Los centímetros son el LARGO DEL PIE (no de la plantilla).

export interface SizeRow {
  ec: string;
  eu: string;
  us: string;
  cm: number;
}

// Hombre: tabla oficial de Brooklyn Store (la talla EC es la misma
// numeración europea, EUR). 40–45 vienen de la tabla de la tienda; 38, 39 y
// 46 siguen la misma escala.
export const MEN_SIZES: SizeRow[] = [
  { ec: '38', eu: '38', us: '6', cm: 24.5 },
  { ec: '39', eu: '39', us: '6.5', cm: 25.0 },
  { ec: '40', eu: '40', us: '7', cm: 25.5 },
  { ec: '41', eu: '41', us: '8', cm: 26.0 },
  { ec: '42', eu: '42', us: '8.5', cm: 26.5 },
  { ec: '43', eu: '43', us: '9.5', cm: 27.5 },
  { ec: '44', eu: '44', us: '10', cm: 28.0 },
  { ec: '45', eu: '45', us: '11', cm: 29.0 },
  { ec: '46', eu: '46', us: '12', cm: 30.0 },
];

// Mujer.
export const WOMEN_SIZES: SizeRow[] = [
  { ec: '34', eu: '35', us: '5', cm: 22.0 },
  { ec: '35', eu: '36', us: '6', cm: 22.8 },
  { ec: '36', eu: '37', us: '6.5', cm: 23.5 },
  { ec: '37', eu: '38', us: '7.5', cm: 24.1 },
  { ec: '38', eu: '39', us: '8.5', cm: 24.8 },
  { ec: '39', eu: '40', us: '9', cm: 25.4 },
  { ec: '40', eu: '41', us: '9.5', cm: 26.0 },
  { ec: '41', eu: '42', us: '10.5', cm: 26.7 },
  { ec: '42', eu: '43', us: '11.5', cm: 27.3 },
];

export type SizeGender = 'hombre' | 'mujer';

// Los modelos unisex usan la tabla de hombre.
export function sizeTableFor(gender: 'hombre' | 'mujer' | 'unisex' = 'unisex'): SizeRow[] {
  return gender === 'mujer' ? WOMEN_SIZES : MEN_SIZES;
}

// Recomienda la talla más pequeña cuyo largo cubre el pie. La horma del
// modelo ajusta la recomendación: si calza pequeño se sube una talla, si
// calza grande y el pie queda justo en el límite se mantiene la menor.
export function recommendSize<T extends { ec: string; cm: number }>(
  table: T[],
  footCm: number,
  fit: 'pequena' | 'normal' | 'grande' = 'normal',
): T | null {
  if (!footCm || footCm <= 0) return null;
  let index = table.findIndex((row) => row.cm >= footCm);
  if (index === -1) return null;
  if (fit === 'pequena') index = Math.min(table.length - 1, index + 1);
  if (fit === 'grande' && index > 0 && footCm - table[index - 1].cm <= 0.3) index -= 1;
  return table[index];
}

// Talla US equivalente a una talla EC según la tabla del modelo (hombre y
// unisex → hombre; mujer → mujer). Tallas fuera de la tabla no tienen
// equivalencia.
export function usSizeFor(ec: string, gender: 'hombre' | 'mujer' | 'unisex' = 'unisex'): string | undefined {
  const key = String(ec).trim();
  const row = sizeTableFor(gender).find((r) => r.ec === key);
  // Unisex en tallas pequeñas (34–37): solo existen en la tabla de mujer.
  if (!row && gender === 'unisex') return WOMEN_SIZES.find((r) => r.ec === key)?.us;
  return row?.us;
}

export function formatSize(size: string, sizeUs?: string): string {
  return sizeUs ? `${size} EC (US ${sizeUs})` : size;
}
