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

const EMPTY: LabelSizes = { readable: false, us: null, usGender: 'desconocido', uk: null, eu: null, cm: null, brand: null };

type Key = 'us' | 'uk' | 'eu' | 'cm';

// Otros sistemas de talla que aparecen como columnas en la etiqueta: no los
// usamos, pero cuentan para alinear cada número con su columna.
const OTHER_SYSTEMS = /^(BR|KR|KOR|MEX|AUS|AU|CN|CHN|JPN|IT)$/;

function plausible(key: Key, n: number): boolean {
  if (key === 'us' || key === 'uk') return n > 0 && n < 19;
  if (key === 'eu') return n >= 30 && n <= 52;
  return (n >= 18 && n <= 35) || (n >= 180 && n <= 350);
}

function keyOf(token: string): Key | null {
  if (/^USA?$/.test(token)) return 'us';
  if (token === 'UK') return 'uk';
  if (/^(EUR?|FR|EU)$/.test(token)) return 'eu';
  if (/^(CM|MM|JP)$/.test(token)) return 'cm';
  return null;
}

// Corrige confusiones típicas del OCR en un número (B→8, O→0, S→5, I/L→1).
function fixDigits(token: string): string {
  return token.replace(/B/g, '8').replace(/[OD]/g, '0').replace(/S/g, '5').replace(/[IL]/g, '1');
}

function toNumber(token: string): number | null {
  const t = fixDigits(token).replace(',', '.');
  const frac = t.match(/^(\d{1,3}(?:\.\d)?)(⅓|½|⅔|1\/3|1\/2|2\/3)?$/);
  if (!frac) return null;
  return num(frac[1], frac[2]);
}

function clean(values: Partial<Record<Key, number | null>>, usGender: LabelSizes['usGender']): LabelSizes {
  let cm = values.cm ?? null;
  if (cm !== null && cm > 100) cm = cm / 10;
  if (cm !== null && (cm < 18 || cm > 35)) cm = null;
  const us = values.us != null && values.us > 0 && values.us < 20 ? values.us : null;
  const uk = values.uk != null && values.uk > 0 && values.uk < 20 ? values.uk : null;
  const eu = values.eu != null && values.eu >= 30 && values.eu <= 52 ? values.eu : null;
  return { readable: us !== null || eu !== null || cm !== null || uk !== null, us, usGender, uk, eu, cm, brand: null };
}

// Respaldo sin IA: interpreta el texto que sacó el lector OCR del navegador.
// Entiende los formatos de etiqueta más comunes:
//   en línea  →  "US 8  UK 7  EUR 41  CM 26"
//   en tabla  →  "US  UK  EUR  CM" y debajo "8  7  41  26"
export function parseLabelText(raw: string): LabelSizes {
  const upper = raw
    .toUpperCase()
    .replace(/[|[\]{}()_"'`~]/g, ' ')
    // Separa números pegados a la siguiente clave: "10UK" → "10 UK"
    .replace(/(\d)(USA?|UK|EUR?|FR|CM|MM|JP)\b/g, '$1 $2');
  const flat = upper.replace(/\s+/g, ' ');
  const usGender = /\bUS\s*W\b|\bWOMEN|\bWMNS|\bW\s*US\b/.test(flat) ? 'mujer' : /\bUS\s*M\b|\bMEN\b|\bM\s*US\b/.test(flat) ? 'hombre' : 'desconocido';
  const values: Partial<Record<Key, number | null>> = {};

  // 1) En línea: clave seguida de su número.
  const tokens = flat.split(' ').filter(Boolean);
  const merged: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    // Fracciones separadas: "7 1/2", "41 1/3"
    if (/^(1\/2|1\/3|2\/3|⅓|½|⅔)$/.test(t) && merged.length && /\d$/.test(merged[merged.length - 1])) {
      merged[merged.length - 1] += t;
      continue;
    }
    // "US8", "EUR41", "CM26" pegados
    const glued = t.match(/^(USA?|UK|EUR?|FR|EU|CM|MM|JP)[:.]?([0-9BOSIL][0-9BOSIL.,⅓½⅔/]*)$/);
    if (glued) {
      merged.push(glued[1], glued[2]);
      continue;
    }
    merged.push(t.replace(/[:.]$/, ''));
  }
  for (let i = 0; i < merged.length; i++) {
    const key = keyOf(merged[i]);
    if (!key || values[key] != null) continue;
    let j = i + 1;
    if (key === 'us' && /^(M|W|MEN|WOMEN)$/.test(merged[j] ?? '')) j++;
    const n = merged[j] !== undefined ? toNumber(merged[j]) : null;
    if (n !== null && plausible(key, n)) values[key] = n;
  }

  // 2) Columnas seguidas: "US UK EUR CM 8 7 41 26" (una tabla leída fila por
  //    fila o cada dato en su línea).
  const isHeader = (t: string) => keyOf(t) !== null || OTHER_SYSTEMS.test(t);
  for (let i = 0; i < merged.length; i++) {
    if (!isHeader(merged[i])) continue;
    const headers: string[] = [];
    let j = i;
    while (j < merged.length && (isHeader(merged[j]) || /^(M|W)$/.test(merged[j]))) {
      if (isHeader(merged[j])) headers.push(merged[j]);
      j++;
    }
    if (headers.length < 2) continue;
    const nums: number[] = [];
    let skipped = 0;
    while (j < merged.length && nums.length < headers.length && skipped <= 2) {
      const n = toNumber(merged[j]);
      if (n !== null) nums.push(n);
      else skipped++;
      j++;
    }
    if (nums.length === headers.length) {
      headers.forEach((h, idx) => {
        const k = keyOf(h);
        if (k && values[k] == null && plausible(k, nums[idx])) values[k] = nums[idx];
      });
      i = j - 1;
    }
  }

  // 2) En tabla: una fila de claves y, en la siguiente fila con números,
  //    los valores en el mismo orden.
  const lines = upper
    .split(/\n+/)
    .map((l) => l.trim().split(/\s+/).filter(Boolean))
    .filter((l) => l.length);
  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].filter((t) => keyOf(t) !== null || OTHER_SYSTEMS.test(t));
    const keys = cols.map(keyOf);
    if (keys.filter(Boolean).length < 2) continue;
    for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
      const nums = lines[j].map(toNumber).filter((n): n is number => n !== null);
      if (nums.length >= keys.length) {
        keys.forEach((k, idx) => {
          if (k && values[k] == null && plausible(k, nums[idx])) values[k] = nums[idx];
        });
        break;
      }
    }
  }

  return clean(values, usGender);
}

// Mejora la foto para el OCR: escala de grises, más contraste y tamaño
// adecuado; opcionalmente girada (muchas etiquetas se fotografían de lado).
async function ocrCanvas(dataUrl: string, rotation: 0 | 90 | 180 | 270): Promise<HTMLCanvasElement> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });
  const target = 2000;
  const scale = Math.min(2.5, target / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = document.createElement('canvas');
  const sideways = rotation === 90 || rotation === 270;
  canvas.width = sideways ? h : w;
  canvas.height = sideways ? w : h;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  let min = 255;
  let max = 0;
  const gray = new Uint8ClampedArray(px.length / 4);
  for (let i = 0, g = 0; i < px.length; i += 4, g++) {
    const v = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    gray[g] = v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = Math.max(1, max - min);
  for (let i = 0, g = 0; i < px.length; i += 4, g++) {
    const v = ((gray[g] - min) / range) * 255;
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

function score(l: LabelSizes): number {
  return (l.us !== null ? 3 : 0) + (l.cm !== null ? 2 : 0) + (l.eu !== null ? 2 : 0) + (l.uk !== null ? 1 : 0);
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
      if (data.label.readable) return data.label;
    }
  } catch {
    // sin conexión con el servidor: seguimos con el respaldo
  }

  onStage?.('Analizando los números de la etiqueta...');
  const { createWorker, PSM } = await import('tesseract.js');
  const worker = await createWorker('eng');
  const deadline = Date.now() + 50_000;
  let best: LabelSizes = EMPTY;
  try {
    // Probamos lectura normal y "texto disperso" (ideal para etiquetas),
    // y si no sale nada, la foto girada.
    const attempts: { rotation: 0 | 90 | 180 | 270; psm: string }[] = [
      { rotation: 0, psm: PSM.AUTO },
      { rotation: 0, psm: PSM.SPARSE_TEXT },
      { rotation: 90, psm: PSM.AUTO },
      { rotation: 270, psm: PSM.AUTO },
      { rotation: 180, psm: PSM.AUTO },
    ];
    for (const [i, attempt] of attempts.entries()) {
      if (Date.now() > deadline) break;
      if (i === 2) onStage?.('Probando la foto en otra orientación...');
      await worker.setParameters({ tessedit_pageseg_mode: attempt.psm as never });
      const canvas = await ocrCanvas(image.dataUrl, attempt.rotation);
      const { data } = await worker.recognize(canvas);
      const parsed = parseLabelText(data.text);
      if (score(parsed) > score(best)) best = parsed;
      // Con US o (cm y EUR) ya tenemos suficiente.
      if (best.us !== null || (best.cm !== null && best.eu !== null)) break;
    }
  } finally {
    await worker.terminate();
  }
  return best;
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
