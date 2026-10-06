import { getActiveProductsServer } from '@/lib/productsServer';
import type { Product } from '@/lib/types';
import { metaItemId } from '@/lib/metaCatalog';
import { photosForColor, sharedPhotos } from '@/lib/colorPhotos';

// Catálogo de productos para Meta (Facebook / Instagram) y Google Merchant.
// Se genera solo con los zapatos activos de la tienda: Meta lo descarga
// cada hora, así que todo producto nuevo, foto o precio que cambies en el
// panel aparece en tus anuncios sin hacer nada más.
//
// URL para pegar en Meta Commerce Manager → Catálogo → Orígenes de datos:
//   https://brooklynstore-six.vercel.app/feed/meta.csv
export const revalidate = 300;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://brooklynstore-six.vercel.app').replace(/\/$/, '');

const COLUMNS = [
  'id',
  'item_group_id',
  'title',
  'description',
  'availability',
  'condition',
  'price',
  'sale_price',
  'link',
  'image_link',
  'additional_image_link',
  'brand',
  'google_product_category',
  'product_type',
  'gender',
  'age_group',
  'color',
  'size',
  'custom_label_0',
  'custom_label_1',
] as const;

type Row = Record<(typeof COLUMNS)[number], string>;

// Foto en JPG con URL absoluta (Meta no acepta WebP ni rutas relativas).
function jpgUrl(src: string | undefined): string {
  if (!src) return '';
  const own = src.match(/^\/api\/img\/([A-Za-z0-9]{10,40})/);
  if (own) return `${SITE_URL}/api/img-jpg/${own[1]}.jpg`;
  if (src.includes('res.cloudinary.com')) return src.replace('/upload/', '/upload/f_jpg,q_auto,w_1080/');
  return src.startsWith('http') ? src : `${SITE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

const money = (n: number) => `${n.toFixed(2)} USD`;

const clean = (text: string, max: number) =>
  text
    .replace(/\p{Extended_Pictographic}|️|‍/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);

const csvCell = (value: string) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

const GENDER: Record<Product['gender'], string> = { hombre: 'male', mujer: 'female', unisex: 'unisex' };

function rows(p: Product): Row[] {
  const brand = p.brand || 'Brooklyn Store';
  const onSale = !!p.compareAtPrice && p.compareAtPrice > p.price;
  const sizes = (p.sizes ?? []).filter(Boolean);
  const description = clean(
    p.description ||
      `${p.title}${p.brand ? ` de ${p.brand}` : ''}. Envío a todo el Ecuador con Servientrega. Paga por transferencia o contra entrega: adelantas $5 y el resto al recibir. Cambio de talla en 48 horas.`,
    4900,
  );
  const base = {
    title: clean(p.title, 150),
    description,
    availability: p.stock === 0 ? 'out of stock' : 'in stock',
    condition: 'new',
    price: money(onSale ? p.compareAtPrice! : p.price),
    sale_price: onSale ? money(p.price) : '',
    brand: clean(brand, 100),
    google_product_category: '187',
    product_type: `Zapatos > ${p.gender === 'mujer' ? 'Mujer' : p.gender === 'hombre' ? 'Hombre' : 'Unisex'} > ${brand}`,
    gender: GENDER[p.gender] ?? 'unisex',
    age_group: 'adult',
    size: sizes.join(', ').slice(0, 100),
    custom_label_0: clean(p.line || brand, 100),
    custom_label_1: p.collection || '',
  };
  const link = (color?: string) =>
    `${SITE_URL}/producto/${encodeURIComponent(p.slug)}?${color ? `color=${encodeURIComponent(color)}&` : ''}utm_source=meta&utm_medium=catalogo`;
  const gallery = (first?: string) =>
    Array.from(new Set([first, ...p.images].filter(Boolean) as string[]))
      .map(jpgUrl)
      .filter(Boolean);

  // Un artículo por color (con su foto); todos agrupados como el mismo modelo.
  const colors = (p.colors ?? []).filter((c) => c.name);
  if (colors.length > 1) {
    return colors.map((c) => {
      const own = photosForColor(p, c.name);
      const images = Array.from(new Set([...own, ...sharedPhotos(p), ...p.images])).map(jpgUrl).filter(Boolean);
      return {
        ...base,
        id: metaItemId(p, c.name),
        item_group_id: p.id,
        title: clean(`${p.title} - ${c.name}`, 150),
        link: link(c.name),
        image_link: images[0] ?? '',
        additional_image_link: images.slice(1, 10).join(','),
        color: clean(c.name, 100),
      };
    });
  }
  const images = gallery(colors[0]?.image);
  return [
    {
      ...base,
      id: metaItemId(p),
      item_group_id: '',
      link: link(),
      image_link: images[0] ?? '',
      additional_image_link: images.slice(1, 10).join(','),
      color: clean(colors[0]?.name ?? '', 100),
    },
  ];
}

export async function GET() {
  let products: Product[];
  try {
    products = await getActiveProductsServer({ demoFallback: false });
  } catch {
    // Si la base no responde, mejor un error que un catálogo vacío: así
    // Meta conserva los productos de la última descarga.
    return new Response('Catálogo no disponible por el momento', { status: 503, headers: { 'Retry-After': '600' } });
  }
  const lines = [COLUMNS.join(',')];
  for (const p of products) {
    for (const row of rows(p)) {
      if (!row.image_link) continue;
      lines.push(COLUMNS.map((c) => csvCell(row[c] ?? '')).join(','));
    }
  }
  return new Response(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
