import sharp from 'sharp';
import { findShareProduct, shareImageFor } from './productShare';
import { getImageVariant } from './storeImages';
import type { OrderCardData } from './orderCard';

export interface ResolvedCardItem {
  slug: string;
  title: string;
  color: string;
  size: string;
  quantity: number;
  image?: string; // URL para mostrar en la página
  photo?: string; // data URI JPEG para la imagen de vista previa
}

// Foto del producto como JPEG liviano (data URI) para dibujar la tarjeta.
async function photoDataUri(src: string, origin?: string): Promise<string | undefined> {
  try {
    let bytes: Buffer | undefined;
    if (src.startsWith('/api/img/')) {
      const id = src.slice('/api/img/'.length).split('?')[0];
      bytes = (await getImageVariant(id, { kind: 'jpg' }))?.data;
    } else if (/^https?:\/\//.test(src) || (src.startsWith('/') && origin)) {
      const res = await fetch(new URL(src, origin), { next: { revalidate: 31536000 } });
      if (res.ok) bytes = Buffer.from(await res.arrayBuffer());
    }
    if (!bytes) return undefined;
    const jpg = await sharp(bytes)
      .rotate()
      .resize(640, 640, { fit: 'contain', background: '#FFFFFF' })
      .flatten({ background: '#FFFFFF' })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpg.toString('base64')}`;
  } catch {
    return undefined;
  }
}

export async function resolveOrderCard(
  data: OrderCardData,
  { withPhotos = false, origin }: { withPhotos?: boolean; origin?: string } = {},
): Promise<ResolvedCardItem[]> {
  return Promise.all(
    data.items.map(async (item) => {
      const product = await findShareProduct(item.slug);
      const image = product ? shareImageFor(product, item.color) : undefined;
      return {
        ...item,
        title: product?.title || item.slug.replace(/-/g, ' '),
        image,
        photo: withPhotos && image ? await photoDataUri(image, origin) : undefined,
      };
    }),
  );
}
