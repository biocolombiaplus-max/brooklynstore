import { sizeTableFor, type SizeGender, type SizeRow } from './sizes';

// Tallas leídas de la etiqueta de un zapato que el cliente ya usa.
export interface LabelSizes {
  readable: boolean;
  us: number | null;
  usGender: 'hombre' | 'mujer' | 'desconocido';
  uk: number | null;
  eu: number | null;
  cm: number | null;
  brand: string | null;
}

export interface LabelRecommendation {
  row: SizeRow;
  gender: SizeGender;
  basis: 'us' | 'cm' | 'eu';
}

// Achica la foto antes de enviarla (las fotos del celular pesan varios MB).
export async function prepareLabelImage(file: File): Promise<{ dataUrl: string; base64: string }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('No pudimos abrir la foto.'));
      el.src = url;
    });
    const max = 1600;
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No pudimos procesar la foto.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    return { dataUrl, base64: dataUrl.split(',')[1] };
  } finally {
    URL.revokeObjectURL(url);
  }
}

const FRACTIONS: Record<string, number> = { '1/3': 0.33, '1/2': 0.5, '2/3': 0.67, '⅓': 0.33, '½': 0.5, '⅔': 0.67 };

function num(value: string, fraction?: string): number {
  const base = Number(value.replace(',', '.'));
  return fraction ? base + (FRACTIONS[fraction.replace(/\s/g, '')] ?? 0) : base;
}

// Respaldo sin IA: interpreta el texto que sacó el lector OCR del navegador.
export function parseLabelText(raw: string): LabelSizes {
  // Corrige confusiones típicas del OCR justo después de US/UK/EUR/CM
  // (B→8, O→0, S→5, I/L→1).
  const text = raw
    .toUpperCase()
    .replace(/[|]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(USA?|UK|EUR?|FR|CM|MM|JP)(\s*[:.]?\s*)([0-9BOSIL]{1,3}(?:[.,][0-9BOS])?)\b/g, (_, key: string, sep: string, value: string) =>
      `${key}${sep}${value.replace(/B/g, '8').replace(/O/g, '0').replace(/S/g, '5').replace(/[IL]/g, '1')}`,
    );
  const frac = '(?:\\s*(1\\s*\\/\\s*[23]|2\\s*\\/\\s*3|[⅓½⅔]))?';
  const pick = (re: RegExp) => {
    const m = text.match(re);
    return m ? num(m[1], m[2]) : null;
  };

  const us = pick(new RegExp(`\\bUSA?\\s*(?:M(?:EN)?|W(?:OMEN)?)?\\s*[:.]?\\s*(\\d{1,2}(?:[.,]5)?)${frac}`));
  const uk = pick(new RegExp(`\\bUK\\s*[:.]?\\s*(\\d{1,2}(?:[.,]5)?)${frac}`));
  const eu = pick(new RegExp(`\\b(?:EUR?|FR|EU)\\s*[:.]?\\s*(\\d{2}(?:[.,]5)?)${frac}`));
  let cm = pick(/\b(?:CM|MM|JP|JPN|CHN)\s*[:.]?\s*(\d{2,3}(?:[.,]\d)?)/);
  if (cm !== null && cm > 100) cm = cm / 10;
  if (cm !== null && (cm < 18 || cm > 35)) cm = null;

  const usGender = /\bUS\s*W|\bWOMEN|\bWMNS/.test(text) ? 'mujer' : /\bUS\s*M\b|\bMEN\b/.test(text) ? 'hombre' : 'desconocido';
  return {
    readable: us !== null || eu !== null || cm !== null || uk !== null,
    us: us !== null && us > 0 && us < 20 ? us : null,
    usGender,
    uk,
    eu: eu !== null && eu >= 30 && eu <= 50 ? eu : null,
    cm,
    brand: null,
  };
}

// Lee la etiqueta: primero con la IA del servidor y, si no está
// configurada o falla, con el lector de texto del navegador.
export async function readLabel(image: { dataUrl: string; base64: string }, onStage?: (stage: string) => void): Promise<LabelSizes> {
  onStage?.('Leyendo tu etiqueta...');
  try {
    const res = await fetch('/api/leer-etiqueta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: image.base64, mediaType: 'image/jpeg' }),
    });
    if (res.ok) {
      const data = (await res.json()) as { label: LabelSizes };
      return data.label;
    }
    if (res.status === 422) return { readable: false, us: null, usGender: 'desconocido', uk: null, eu: null, cm: null, brand: null };
  } catch {
    // sin conexión con el servidor: seguimos con el respaldo
  }

  onStage?.('Analizando los números de la etiqueta...');
  const { recognize } = await import('tesseract.js');
  const result = await Promise.race([
    recognize(image.dataUrl, 'eng'),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 45_000)),
  ]);
  return parseLabelText(result.data.text);
}

function nearestBy(table: SizeRow[], value: number, key: (r: SizeRow) => number): SizeRow | null {
  const first = table[0];
  const last = table[table.length - 1];
  if (value < key(first) - 1 || value > key(last) + 1) return null;
  let best: SizeRow | null = null;
  let bestDiff = Infinity;
  for (const row of table) {
    const diff = Math.abs(key(row) - value);
    // En empate gana la talla mayor (mejor que apriete a que sobre).
    if (diff < bestDiff || (diff === bestDiff && best && key(row) > key(best))) {
      best = row;
      bestDiff = diff;
    }
  }
  return best;
}

/**
 * Convierte lo que dice la etiqueta a nuestra talla. Prioridad: talla US
 * (la tabla de la tienda está armada sobre ella), luego centímetros y por
 * último EUR. Si la etiqueta dice que es de mujer/hombre se usa esa tabla,
 * salvo que el modelo sea de un género fijo.
 */
export function recommendFromLabel(label: LabelSizes, preferred: SizeGender, locked: boolean): LabelRecommendation | null {
  const gender: SizeGender = !locked && label.usGender !== 'desconocido' ? label.usGender : preferred;
  const table = sizeTableFor(gender);

  if (label.us !== null) {
    // Etiqueta de mujer en un modelo de hombre (o al revés): US mujer = US hombre + 1,5.
    let us = label.us;
    if (label.usGender === 'mujer' && gender === 'hombre') us -= 1.5;
    if (label.usGender === 'hombre' && gender === 'mujer') us += 1.5;
    const exact = table.find((r) => Number(r.us) === us);
    const row = exact ?? nearestBy(table, us, (r) => Number(r.us));
    if (row) return { row, gender, basis: 'us' };
  }
  if (label.cm !== null) {
    const row = nearestBy(table, label.cm, (r) => r.cm);
    if (row) return { row, gender, basis: 'cm' };
  }
  if (label.eu !== null) {
    const eu = Math.floor(label.eu + 0.01);
    const row = table.find((r) => Number(r.eu) === eu);
    if (row) return { row, gender, basis: 'eu' };
  }
  return null;
}
