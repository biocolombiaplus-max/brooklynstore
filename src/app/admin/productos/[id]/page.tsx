'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getProductById } from '@/lib/products';
import type { Product } from '@/lib/types';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    getProductById(params.id)
      .then(setProduct)
      .catch(() => setProduct(null));
  }, [params.id]);

  if (product === undefined) {
    return <p className="text-muted">Cargando producto...</p>;
  }

  if (product === null) {
    return <p className="text-urgent">Producto no encontrado.</p>;
  }

  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Editar producto</h1>
      <p className="mb-6 text-sm text-muted">{product.title}</p>
      <ProductForm product={product} />
    </div>
  );
}
