import type { Product } from '@/lib/types';
import ProductCard from './ProductCard';

export default function ProductGrid({
  products,
  emptyMessage = 'No hay productos disponibles todavía.',
}: {
  products: Product[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return <p className="py-12 text-center text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 4} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="skeleton mt-3 h-3 w-1/3 rounded" />
          <div className="skeleton mt-2 h-4 w-3/4 rounded" />
          <div className="skeleton mt-2 h-4 w-1/4 rounded" />
        </div>
      ))}
    </div>
  );
}
