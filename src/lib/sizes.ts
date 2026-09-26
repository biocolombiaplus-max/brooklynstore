// Tablas de equivalencia de tallas. La talla "EC" es la que usamos en toda
// la tienda (la misma numeración que se usa en los almacenes del Ecuador).
// Los centímetros son el LARGO DEL PIE (no de la plantilla).

export interface SizeRow {
  ec: string;
  eu: string;
  usM: string;
  usW: string;
  cm: number;
}

export const ADULT_SIZES: SizeRow[] = [
  { ec: '34', eu: '35', usM: '3.5', usW: '5', cm: 22.0 },
  { ec: '35', eu: '36', usM: '4.5', usW: '6', cm: 22.8 },
  { ec: '36', eu: '37', usM: '5', usW: '6.5', cm: 23.5 },
  { ec: '37', eu: '38', usM: '6', usW: '7.5', cm: 24.1 },
  { ec: '38', eu: '39', usM: '7', usW: '8.5', cm: 24.8 },
  { ec: '39', eu: '40', usM: '7.5', usW: '9', cm: 25.4 },
  { ec: '40', eu: '41', usM: '8', usW: '9.5', cm: 26.0 },
  { ec: '41', eu: '42', usM: '9', usW: '10.5', cm: 26.7 },
  { ec: '42', eu: '43', usM: '10', usW: '11.5', cm: 27.3 },
  { ec: '43', eu: '44', usM: '10.5', usW: '12', cm: 28.0 },
  { ec: '44', eu: '45', usM: '11.5', usW: '13', cm: 28.6 },
  { ec: '45', eu: '46', usM: '12', usW: '13.5', cm: 29.4 },
];

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

// Talla US equivalente a una talla EC: la de hombre para modelos de hombre y
// unisex, la de mujer para modelos de mujer. Tallas fuera de la tabla
// (personalizadas, "Única"...) no tienen equivalencia.
export function usSizeFor(ec: string, gender: 'hombre' | 'mujer' | 'unisex' = 'unisex'): string | undefined {
  const row = ADULT_SIZES.find((r) => r.ec === String(ec).trim());
  if (!row) return undefined;
  return gender === 'mujer' ? row.usW : row.usM;
}

export function formatSize(size: string, sizeUs?: string): string {
  return sizeUs ? `${size} EC (US ${sizeUs})` : size;
}
