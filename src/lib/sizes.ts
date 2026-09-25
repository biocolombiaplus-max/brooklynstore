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

export interface KidSizeRow {
  ec: string;
  eu: string;
  us: string;
  cm: number;
  age: string;
}

export const KID_SIZES: KidSizeRow[] = [
  { ec: '21', eu: '22', us: '6C', cm: 13.3, age: '1-2 años' },
  { ec: '22', eu: '23', us: '7C', cm: 14.0, age: '2 años' },
  { ec: '23', eu: '24', us: '8C', cm: 14.6, age: '2-3 años' },
  { ec: '24', eu: '25', us: '8.5C', cm: 15.3, age: '3 años' },
  { ec: '25', eu: '26', us: '9C', cm: 15.9, age: '3-4 años' },
  { ec: '26', eu: '27', us: '10C', cm: 16.5, age: '4 años' },
  { ec: '27', eu: '28', us: '11C', cm: 17.1, age: '5 años' },
  { ec: '28', eu: '29', us: '11.5C', cm: 17.8, age: '5-6 años' },
  { ec: '29', eu: '30', us: '12C', cm: 18.4, age: '6 años' },
  { ec: '30', eu: '31', us: '13C', cm: 19.1, age: '7 años' },
  { ec: '31', eu: '32', us: '13.5C', cm: 19.7, age: '7-8 años' },
  { ec: '32', eu: '33', us: '1Y', cm: 20.3, age: '8 años' },
  { ec: '33', eu: '34', us: '2Y', cm: 21.0, age: '9 años' },
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

export function isKidSizes(sizes: string[]): boolean {
  return sizes.length > 0 && sizes.every((s) => Number(s) <= 33);
}
