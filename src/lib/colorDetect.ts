'use client';

// Detecta los colores de un zapato en una foto (sin servicios externos, todo
// en el navegador): el color principal del zapato y, si la parte de abajo
// (la suela) es claramente distinta, un segundo color. Ignora el fondo
// (tomado de los bordes de la foto) y devuelve un nombre en español.

export interface DetectedColor {
  name: string;
  hex: string;
  hex2?: string;
}

type RGB = [number, number, number];

const toHex = ([r, g, b]: RGB) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
const dist = (a: RGB, b: RGB) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

function toHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

export function colorName(rgb: RGB): string {
  const [h, s, l] = toHsl(rgb);
  if (l < 0.16) return 'Negro';
  if (l > 0.9 && s < 0.35) return 'Blanco';
  if (s < 0.14) {
    if (l > 0.86) return 'Blanco hueso';
    if (l > 0.62) return 'Gris claro';
    if (l > 0.32) return 'Gris';
    return 'Gris oscuro';
  }
  if (h >= 20 && h < 50 && l > 0.68) return 'Beige';
  if (h >= 12 && h < 45 && l < 0.5) return 'Café';
  if (h < 12 || h >= 345) return l > 0.7 ? 'Rosado' : l < 0.3 ? 'Vino' : 'Rojo';
  if (h < 40) return 'Naranja';
  if (h < 68) return l < 0.35 ? 'Oliva' : 'Amarillo';
  if (h < 165) return l < 0.3 ? 'Verde oscuro' : 'Verde';
  if (h < 200) return 'Celeste';
  if (h < 255) return l < 0.32 ? 'Azul marino' : l > 0.68 ? 'Celeste' : 'Azul';
  if (h < 290) return l > 0.65 ? 'Lila' : 'Morado';
  return l > 0.62 ? 'Rosado' : 'Fucsia';
}

function loadImage(src: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(src);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('imagen no válida'));
    };
    img.src = url;
  });
}

// Agrupa píxeles en "cubetas" de color y devuelve el promedio de la más grande.
function dominant(pixels: RGB[]): { color: RGB; share: number } | null {
  if (pixels.length === 0) return null;
  const buckets = new Map<string, { n: number; sum: RGB }>();
  for (const p of pixels) {
    const key = `${p[0] >> 5},${p[1] >> 5},${p[2] >> 5}`;
    const b = buckets.get(key) ?? { n: 0, sum: [0, 0, 0] };
    b.n++;
    b.sum[0] += p[0];
    b.sum[1] += p[1];
    b.sum[2] += p[2];
    buckets.set(key, b);
  }
  let best: { n: number; sum: RGB } | null = null;
  buckets.forEach((b) => {
    if (!best || b.n > best.n) best = b;
  });
  const top = best as unknown as { n: number; sum: RGB };
  const center: RGB = [top.sum[0] / top.n, top.sum[1] / top.n, top.sum[2] / top.n];
  // Promedia también los píxeles cercanos para un tono más fiel.
  const near = pixels.filter((p) => dist(p, center) < 38);
  const avg: RGB = [0, 0, 0];
  near.forEach((p) => {
    avg[0] += p[0];
    avg[1] += p[1];
    avg[2] += p[2];
  });
  return { color: [avg[0] / near.length, avg[1] / near.length, avg[2] / near.length], share: near.length / pixels.length };
}

export async function detectShoeColors(file: Blob): Promise<DetectedColor | null> {
  const img = await loadImage(file);
  const W = 120;
  const H = Math.max(1, Math.round((img.height / img.width) * W));
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, W, H);
  const data = ctx.getImageData(0, 0, W, H).data;
  const at = (x: number, y: number): [number, number, number, number] => {
    const i = (y * W + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };

  // Fondo = color más común en los bordes de la foto.
  const border: RGB[] = [];
  for (let x = 0; x < W; x++) {
    for (const y of [0, 1, H - 2, H - 1]) {
      const p = at(x, Math.max(0, Math.min(H - 1, y)));
      if (p[3] > 128) border.push([p[0], p[1], p[2]]);
    }
  }
  for (let y = 0; y < H; y++) {
    for (const x of [0, 1, W - 2, W - 1]) {
      const p = at(x, y);
      if (p[3] > 128) border.push([p[0], p[1], p[2]]);
    }
  }
  const bg = dominant(border)?.color;

  // Fondo = lo que está conectado con los bordes de la foto y se parece al
  // color de fondo (avanzando solo por cambios suaves, para seguir sombras y
  // degradados sin "comerse" un zapato claro).
  const isBg = new Uint8Array(W * H);
  const rgbAt = (x: number, y: number): RGB | null => {
    const p = at(x, y);
    return p[3] < 128 ? null : [p[0], p[1], p[2]];
  };
  const queue: number[] = [];
  const pushIfBg = (x: number, y: number, from: RGB | null) => {
    const idx = y * W + x;
    if (isBg[idx]) return;
    const c = rgbAt(x, y);
    if (!c) {
      isBg[idx] = 1;
      queue.push(idx);
      return;
    }
    if (!bg || dist(c, bg) > 34) return;
    if (from && dist(c, from) > 5) return;
    isBg[idx] = 1;
    queue.push(idx);
  };
  for (let x = 0; x < W; x++) {
    pushIfBg(x, 0, null);
    pushIfBg(x, H - 1, null);
  }
  for (let y = 0; y < H; y++) {
    pushIfBg(0, y, null);
    pushIfBg(W - 1, y, null);
  }
  while (queue.length) {
    const idx = queue.pop() as number;
    const x = idx % W;
    const y = (idx - x) / W;
    const from = rgbAt(x, y);
    if (x > 0) pushIfBg(x - 1, y, from);
    if (x < W - 1) pushIfBg(x + 1, y, from);
    if (y > 0) pushIfBg(x, y - 1, from);
    if (y < H - 1) pushIfBg(x, y + 1, from);
  }

  // Píxeles del zapato: todo lo que no es fondo.
  const fg: { p: RGB; y: number }[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isBg[y * W + x]) continue;
      const rgb = rgbAt(x, y);
      if (rgb) fg.push({ p: rgb, y });
    }
  }
  if (fg.length < W * H * 0.03) return null;

  const main = dominant(fg.map((f) => f.p));
  if (!main) return null;

  // Suela: la franja inferior del zapato.
  const ys = fg.map((f) => f.y).sort((a, b) => a - b);
  const top = ys[Math.floor(ys.length * 0.02)];
  const bottom = ys[Math.floor(ys.length * 0.98)];
  const soleStart = bottom - (bottom - top) * 0.22;
  const sole = dominant(fg.filter((f) => f.y >= soleStart).map((f) => f.p));

  const name1 = colorName(main.color);
  if (sole && sole.share > 0.35 && dist(sole.color, main.color) > 70) {
    const name2 = colorName(sole.color);
    if (name2 !== name1) {
      return { name: `${name1} / ${name2}`, hex: toHex(main.color), hex2: toHex(sole.color) };
    }
  }
  return { name: name1, hex: toHex(main.color) };
}
