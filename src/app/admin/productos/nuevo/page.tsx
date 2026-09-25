import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Nuevo producto</h1>
      <p className="mb-6 text-sm text-muted">Completa los datos y publícalo en minutos</p>
      <ProductForm />
    </div>
  );
}
