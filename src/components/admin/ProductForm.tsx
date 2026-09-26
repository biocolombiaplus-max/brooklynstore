'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { FITS, GENDERS, type Fit, type Gender, type Product, type ProductColor, type ProductInput, type ProductReview } from '@/lib/types';
import { useSiteSettings } from '@/lib/settings-context';
import { slugify } from '@/lib/utils';
import { createProduct, updateProduct, deleteProduct } from '@/lib/products';
import { uploadProductImage, deleteProductImage, type ImageCropMode } from '@/lib/storage';
import { resizeForUpload } from '@/lib/imageCrop';
import { detectShoeColors, type DetectedColor } from '@/lib/colorDetect';
import { usSizeFor } from '@/lib/sizes';
import ColorSwatch from '@/components/ColorSwatch';

const COMMON_SIZES = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: 'Hombre (38-44)', sizes: ['38', '39', '40', '41', '42', '43', '44'] },
  { label: 'Mujer (35-40)', sizes: ['35', '36', '37', '38', '39', '40'] },
  { label: 'Unisex (36-43)', sizes: ['36', '37', '38', '39', '40', '41', '42', '43'] },
];
const QUICK_COLORS: ProductColor[] = [
  { name: 'Negro', hex: '#111111' },
  { name: 'Blanco', hex: '#FFFFFF' },
  { name: 'Gris', hex: '#9CA3AF' },
  { name: 'Azul marino', hex: '#1E3A8A' },
  { name: 'Rojo', hex: '#DC2626' },
  { name: 'Café', hex: '#6B4226' },
  { name: 'Beige', hex: '#E8DCC4' },
  { name: 'Rosado', hex: '#F9A8D4' },
  // Dos tonos: capellada / suela
  { name: 'Blanco / Negro', hex: '#FFFFFF', hex2: '#111111' },
  { name: 'Negro / Blanco', hex: '#111111', hex2: '#FFFFFF' },
  { name: 'Blanco / Goma', hex: '#FFFFFF', hex2: '#B5835A' },
  { name: 'Negro / Goma', hex: '#111111', hex2: '#B5835A' },
  { name: 'Gris / Blanco', hex: '#9CA3AF', hex2: '#FFFFFF' },
];
const COMMON_COLLECTIONS = ['deportivos', 'urbanos', 'running', 'basket', 'sandalias', 'botas'];
// Un color de un solo tono no guarda "hex2" (Firestore no acepta undefined).
function stripHex2(color: ProductColor): ProductColor {
  if (color.hex2 && color.hex2.toLowerCase() !== color.hex.toLowerCase()) return color;
  const { hex2: _hex2, ...rest } = color;
  return rest;
}

const sortSizes = (list: string[]) => [...list].sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const { brands: knownBrands, payments: paySettings } = useSiteSettings();
  const isEditing = !!product;

  const [title, setTitle] = useState(product?.title ?? '');
  const [slug, setSlug] = useState(product?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(isEditing);
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product?.price?.toString() ?? String(paySettings.defaultPrice || ''));
  const [codPrice, setCodPrice] = useState(product?.codPrice ? String(product.codPrice) : '');
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPrice?.toString() ?? '');
  const [collectionName, setCollectionName] = useState(product?.collection ?? 'urbanos');
  const [brand, setBrand] = useState(product?.brand ?? '');
  const [gender, setGender] = useState<Gender>(product?.gender ?? 'unisex');
  const [fit, setFit] = useState<Fit>(product?.fit ?? 'normal');
  const [isNew, setIsNew] = useState(product?.isNew ?? false);
  const [stock, setStock] = useState(product?.stock?.toString() ?? '20');
  const [featured, setFeatured] = useState(product?.featured ?? false);
  const [active, setActive] = useState(product?.active ?? true);
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [colors, setColors] = useState<ProductColor[]>(product?.colors ?? []);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [soldCount, setSoldCount] = useState(product?.soldCount?.toString() ?? '');
  const [reviews, setReviews] = useState<ProductReview[]>(product?.reviews ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [cropMode, setCropMode] = useState<ImageCropMode>('fill');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [customSize, setCustomSize] = useState('');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#111111');
  const [customTwoTone, setCustomTwoTone] = useState(false);
  const [customColorHex2, setCustomColorHex2] = useState('#FFFFFF');
  const [autoColors, setAutoColors] = useState(true);
  const [detectNote, setDetectNote] = useState('');
  const [newReview, setNewReview] = useState<ProductReview>({ name: '', city: '', rating: 5, text: '' });

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function toggleSize(size: string) {
    setSizes((s) => (s.includes(size) ? s.filter((x) => x !== size) : sortSizes([...s, size])));
  }

  function addCustomSize() {
    const value = customSize.trim();
    if (!value) return;
    if (!sizes.includes(value)) setSizes((s) => sortSizes([...s, value]));
    setCustomSize('');
  }

  function toggleQuickColor(color: ProductColor) {
    setColors((c) =>
      c.some((x) => x.name === color.name) ? c.filter((x) => x.name !== color.name) : [...c, color],
    );
  }

  function addCustomColor() {
    const name = customColorName.trim();
    if (!name) return;
    const hex2 = customTwoTone ? customColorHex2 : undefined;
    if (colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setColors((c) =>
        c.map((x) => (x.name.toLowerCase() === name.toLowerCase() ? stripHex2({ ...x, hex: customColorHex, hex2 }) : x)),
      );
    } else {
      setColors((c) => [...c, stripHex2({ name, hex: customColorHex, hex2 })]);
    }
    setCustomColorName('');
  }

  function editColor(name: string, patch: Partial<ProductColor>) {
    setColors((c) => c.map((x) => (x.name === name ? stripHex2({ ...x, ...patch }) : x)));
  }

  // Agrega el color detectado en una foto (o le asigna la foto si ese color
  // ya existía sin foto) — así, al subir las fotos, los colores quedan listos.
  function applyDetectedColor(detected: DetectedColor, url: string) {
    let added = false;
    setColors((prev) => {
      const existing = prev.find((c) => c.name.toLowerCase() === detected.name.toLowerCase());
      if (existing) return prev.map((c) => (c === existing && !c.image ? { ...c, image: url } : c));
      added = true;
      return [...prev, stripHex2({ name: detected.name, hex: detected.hex, hex2: detected.hex2, image: url })];
    });
    return added;
  }

  function removeColor(name: string) {
    setColors((c) => c.filter((x) => x.name !== name));
  }

  function updateColorImage(name: string, image: string) {
    setColors((c) =>
      c.map((x) => {
        if (x.name !== name) return x;
        if (!image) {
          const { image: _unused, ...rest } = x;
          return rest;
        }
        return { ...x, image };
      }),
    );
  }

  function addReview() {
    if (!newReview.name.trim() || !newReview.text.trim()) return;
    setReviews((r) => [...r, { ...newReview, name: newReview.name.trim(), text: newReview.text.trim() }]);
    setNewReview({ name: '', city: '', rating: 5, text: '' });
  }

  function removeReview(index: number) {
    setReviews((r) => r.filter((_, i) => i !== index));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!slug) {
      setUploadError('Escribe primero el título del producto (lo necesitamos para organizar las fotos).');
      e.target.value = '';
      return;
    }
    setUploadError('');
    const queued = Array.from(files);
    e.target.value = '';

    setUploading(true);
    try {
      for (const original of queued) {
        try {
          const resized = await resizeForUpload(original);
          const uploadFile = new File([resized], original.name || `${slug}.jpg`, { type: 'image/jpeg' });
          const detected = autoColors ? await detectShoeColors(resized).catch(() => null) : null;
          const url = await uploadProductImage(uploadFile, slug, cropMode);
          setImages((prev) => [...prev, url]);
          if (detected) {
            applyDetectedColor(detected, url);
            setDetectNote(`🎨 Detectamos «${detected.name}» en tu foto y lo dejamos listo con su foto. Puedes cambiar el nombre o el tono abajo.`);
          }
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : 'No se pudo subir la foto. Intenta de nuevo.');
        }
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveImage(url: string) {
    setImages((prev) => prev.filter((i) => i !== url));
    deleteProductImage(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!title || !slug || !price) {
      setError('Título, slug y precio son obligatorios.');
      return;
    }

    setSaving(true);
    const input: ProductInput = {
      slug,
      title,
      brand: brand.trim(),
      gender,
      fit,
      isNew,
      description,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
      codPrice: codPrice ? Number(codPrice) : null,
      images,
      sizes,
      colors,
      collection: collectionName,
      stock: Number(stock) || 0,
      featured,
      active,
      soldCount: Number(soldCount) || 0,
      reviewsCount: reviews.length,
      reviews,
    };

    try {
      if (isEditing) {
        await updateProduct(product.id, input);
      } else {
        await createProduct(input);
      }
      router.push('/admin/productos');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar el producto. Verifica los datos e intenta de nuevo.',
      );
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`¿Eliminar "${product.title}"? Esta acción no se puede deshacer.`)) return;
    await deleteProduct(product.id);
    router.push('/admin/productos');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="rounded-card bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-heading text-lg font-bold text-ink">Información básica</h2>

          <label className="mb-1 block text-sm font-semibold text-ink">Título *</label>
          <input
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
            placeholder="Ej: Nike Air Force 1 '07"
          />

          <label className="mb-1 block text-sm font-semibold text-ink">URL (slug) *</label>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            className="mb-4 w-full rounded-lg border border-border px-4 py-2.5 font-mono text-sm focus:border-primary focus:outline-none"
          />

          <label className="mb-1 block text-sm font-semibold text-ink">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
            placeholder="Materiales, tecnología, detalles... (usa • al inicio de cada línea para hacer una lista)"
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">Marca</label>
              <input
                list="known-brands"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
                placeholder="Ej: Nike"
              />
              <datalist id="known-brands">
                {knownBrands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">Para</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 focus:border-primary focus:outline-none"
              >
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-ink">¿Cómo calza la horma?</label>
              <select
                value={fit}
                onChange={(e) => setFit(e.target.value as Fit)}
                className="w-full rounded-lg border border-border bg-white px-4 py-2.5 focus:border-primary focus:outline-none"
              >
                {FITS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">
            La horma se muestra al cliente en la ficha y ajusta la talla que recomienda la calculadora (ej: si calza pequeño,
            recomienda una talla más).
          </p>
        </div>

        <div className="rounded-card bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-heading text-lg font-bold text-ink">Fotos del producto</h2>

          <div className="mb-4 flex gap-2 rounded-lg bg-cream-alt/60 p-1">
            <button
              type="button"
              onClick={() => setCropMode('fill')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                cropMode === 'fill' ? 'bg-white text-primary shadow-soft' : 'text-muted'
              }`}
            >
              🔲 Recortar a cuadrado
            </button>
            <button
              type="button"
              onClick={() => setCropMode('fit')}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-bold transition-colors ${
                cropMode === 'fit' ? 'bg-white text-primary shadow-soft' : 'text-muted'
              }`}
            >
              🖼️ Ajustar sin recortar
            </button>
          </div>
          <p className="mb-3 -mt-2 text-xs text-muted">
            {cropMode === 'fill'
              ? 'Llena todo el cuadro detectando el producto con IA — ideal para fotos ya cuadradas, pero en fotos muy verticales puede cortarle un pedazo al calzado.'
              : 'Encoge la foto para que se vea COMPLETA, sin cortar nada, rellenando el espacio sobrante con un fondo a juego — recomendado para fotos verticales tipo redes sociales.'}
            {' '}Este interruptor solo aplica a las fotos que subas de ahora en adelante.
          </p>

          <div className="mb-4 flex flex-wrap gap-3">
            {images.map((url) => (
              <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border border-border">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/80 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-xs text-muted hover:border-primary">
              {uploading ? 'Subiendo...' : '+ Agregar'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>
          {uploadError && (
            <p className="mb-2 rounded-lg bg-urgent/10 p-3 text-sm text-urgent">{uploadError}</p>
          )}
          <p className="text-xs text-muted">
            Sube varias fotos a la vez, de cualquier tamaño o proporción. La primera foto será la principal, y
            cada una se optimiza automáticamente para que la tienda cargue rápido.
          </p>
        </div>

        <div className="rounded-card bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-heading text-lg font-bold text-ink">Tallas y colores</h2>

          <p className="mb-1 text-sm font-semibold text-ink">Tallas disponibles</p>
          <p className="mb-2 text-xs text-muted">
            Número grande = talla Ecuador (EC). Debajo, su equivalente US ({gender === 'mujer' ? 'mujer' : 'hombre'}), que también verá el
            cliente.
          </p>
          <div className="mb-3 flex flex-wrap gap-2">
            {SIZE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setSizes(preset.sizes)}
                className="rounded-full border border-border bg-cream-alt px-3 py-1.5 text-xs font-bold text-ink hover:border-primary"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {COMMON_SIZES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSize(s)}
                className={`flex h-14 w-14 flex-col items-center justify-center rounded-lg border-2 leading-none ${
                  sizes.includes(s) ? 'border-primary bg-primary text-white' : 'border-border bg-white text-ink'
                }`}
              >
                <span className="text-sm font-bold">{s}</span>
                <span className={`mt-1 text-[10px] font-semibold ${sizes.includes(s) ? 'text-white/80' : 'text-muted'}`}>
                  US {usSizeFor(s, gender)}
                </span>
              </button>
            ))}
            {sizes
              .filter((s) => !COMMON_SIZES.includes(s))
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSize(s)}
                  className="flex h-10 items-center gap-1 rounded-lg border-2 border-primary bg-primary px-3 text-sm font-semibold text-white"
                >
                  {s} <span className="text-xs">✕</span>
                </button>
              ))}
          </div>
          <div className="mb-5 flex gap-2">
            <input
              value={customSize}
              onChange={(e) => setCustomSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSize();
                }
              }}
              placeholder="Talla personalizada (ej: XL, 43, única)"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button type="button" onClick={addCustomSize} className="btn-secondary px-4 py-2 text-sm">
              + Agregar
            </button>
          </div>

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">Colores disponibles</p>
            <label className="flex items-center gap-2 rounded-full bg-gold-50 px-3 py-1.5 text-xs font-bold text-ink ring-1 ring-primary/30">
              <input type="checkbox" checked={autoColors} onChange={(e) => setAutoColors(e.target.checked)} />
              🎨 Detectar colores al subir fotos
            </label>
          </div>
          {detectNote && <p className="mb-3 rounded-lg bg-gold-50 p-2.5 text-xs font-semibold text-ink">{detectNote}</p>}
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_COLORS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => toggleQuickColor(c)}
                className={`flex items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-semibold ${
                  colors.some((x) => x.name === c.name) ? 'border-primary bg-primary-light/20' : 'border-border'
                }`}
              >
                <ColorSwatch hex={c.hex} hex2={c.hex2} className="h-4 w-4" />
                {c.name}
              </button>
            ))}
            {colors
              .filter((c) => !QUICK_COLORS.some((q) => q.name === c.name))
              .map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => removeColor(c.name)}
                  className="flex items-center gap-2 rounded-full border-2 border-primary bg-primary-light/20 px-3 py-1.5 text-xs font-semibold"
                >
                  <ColorSwatch hex={c.hex} hex2={c.hex2} className="h-4 w-4" />
                  {c.name} <span>✕</span>
                </button>
              ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex flex-col items-center text-[10px] font-semibold text-muted">
              <input
                type="color"
                value={customColorHex}
                onChange={(e) => setCustomColorHex(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-border"
              />
              Zapato
            </label>
            {customTwoTone && (
              <label className="flex flex-col items-center text-[10px] font-semibold text-muted">
                <input
                  type="color"
                  value={customColorHex2}
                  onChange={(e) => setCustomColorHex2(e.target.value)}
                  className="h-10 w-12 cursor-pointer rounded-lg border border-border"
                />
                Suela
              </label>
            )}
            <ColorSwatch hex={customColorHex} hex2={customTwoTone ? customColorHex2 : undefined} className="h-9 w-9" />
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <input type="checkbox" checked={customTwoTone} onChange={(e) => setCustomTwoTone(e.target.checked)} />
              Dos colores
            </label>
            <input
              value={customColorName}
              onChange={(e) => setCustomColorName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomColor();
                }
              }}
              placeholder={customTwoTone ? 'Nombre (ej: Blanco / Negro)' : 'Nombre del color (ej: Rosa palo)'}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button type="button" onClick={addCustomColor} className="btn-secondary px-4 py-2 text-sm">
              + Agregar
            </button>
          </div>

          {colors.length > 0 && images.length > 0 && (
            <div className="mt-4 space-y-4 border-t border-border pt-4">
              <div>
                <p className="text-sm font-semibold text-ink">Foto de cada color</p>
                <p className="text-xs text-muted">
                  Toca la foto que corresponde a cada color. Si dejas un color en &ldquo;Principal&rdquo;, se
                  mostrará siempre la primera foto al elegirlo — así nunca se muestra el color equivocado.
                </p>
              </div>

              {colors.some((c) => !c.image) && colors.length > 1 && (
                <p className="rounded-lg bg-urgent/10 p-2.5 text-xs font-semibold text-urgent">
                  ⚠️ Hay colores sin foto asignada — al elegirlos en la tienda se verá la foto principal en vez
                  de la foto real de ese color. Asígnales una abajo para que el cambio de color se vea bien.
                </p>
              )}

              {colors.map((c) => (
                <div key={c.name}>
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <ColorSwatch hex={c.hex} hex2={c.hex2} className="h-6 w-6" />
                    <input
                      defaultValue={c.name}
                      onBlur={(e) => {
                        const name = e.target.value.trim();
                        if (name && name !== c.name && !colors.some((x) => x.name.toLowerCase() === name.toLowerCase())) {
                          editColor(c.name, { name });
                        } else e.target.value = c.name;
                      }}
                      className="w-44 rounded-md border border-border px-2 py-1 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
                      aria-label="Nombre del color"
                    />
                    <input
                      type="color"
                      value={c.hex}
                      onChange={(e) => editColor(c.name, { hex: e.target.value })}
                      title="Color del zapato"
                      className="h-7 w-9 cursor-pointer rounded border border-border"
                    />
                    <input
                      type="color"
                      value={c.hex2 ?? c.hex}
                      onChange={(e) => editColor(c.name, { hex2: e.target.value })}
                      title="Color de la suela (dos tonos)"
                      className="h-7 w-9 cursor-pointer rounded border border-border"
                    />
                    {c.hex2 ? (
                      <button type="button" onClick={() => editColor(c.name, { hex2: undefined })} className="text-[11px] text-muted underline">
                        Un solo color
                      </button>
                    ) : (
                      <span className="text-[11px] text-muted">← toca para agregar color de suela</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateColorImage(c.name, '')}
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 px-1 text-center text-[10px] font-semibold leading-tight text-muted ${
                        !c.image ? 'border-primary bg-primary-light/10 text-primary' : 'border-border'
                      }`}
                    >
                      Principal
                    </button>
                    {images.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => updateColorImage(c.name, url)}
                        aria-label={`Foto ${i + 1} para ${c.name}`}
                        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                          c.image === url ? 'border-primary' : 'border-border'
                        }`}
                      >
                        <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-card bg-white p-6 shadow-soft lg:col-span-2">
        <h2 className="mb-1 font-heading text-lg font-bold text-ink">Reseñas de clientes</h2>
        <p className="mb-4 text-xs text-muted">
          Reseñas reales que le escribiste o te enviaron por WhatsApp/Instagram — se muestran en la ficha del
          producto. Solo agrega reseñas verdaderas de clientes reales.
        </p>

        {reviews.length > 0 && (
          <ul className="mb-4 space-y-2">
            {reviews.map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {'★'.repeat(r.rating)}
                    {'☆'.repeat(5 - r.rating)} {r.name}
                    {r.city && <span className="font-normal text-muted"> · {r.city}</span>}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">{r.text}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeReview(i)}
                  className="shrink-0 text-xs font-semibold text-urgent"
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="grid gap-3 rounded-lg bg-cream-alt/50 p-4 sm:grid-cols-2">
          <input
            value={newReview.name}
            onChange={(e) => setNewReview((r) => ({ ...r, name: e.target.value }))}
            placeholder="Nombre de la clienta *"
            className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <input
            value={newReview.city ?? ''}
            onChange={(e) => setNewReview((r) => ({ ...r, city: e.target.value }))}
            placeholder="Ciudad (opcional)"
            className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <select
            value={newReview.rating}
            onChange={(e) => setNewReview((r) => ({ ...r, rating: Number(e.target.value) }))}
            className="rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)} ({n})
              </option>
            ))}
          </select>
          <div className="sm:col-span-2">
            <textarea
              value={newReview.text}
              onChange={(e) => setNewReview((r) => ({ ...r, text: e.target.value }))}
              placeholder="Qué dijo la clienta *"
              rows={2}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={addReview}
            disabled={!newReview.name.trim() || !newReview.text.trim()}
            className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 sm:col-span-2"
          >
            + Agregar reseña
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <div className="rounded-card bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-heading text-lg font-bold text-ink">Precio e inventario</h2>

          <label className="mb-1 block text-sm font-semibold text-ink">Precio en dólares (USD) *</label>
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
            placeholder="Ej: 89.99"
          />

          <label className="mb-1 block text-sm font-semibold text-ink">Precio contra entrega (opcional, envío incluido)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={codPrice}
            onChange={(e) => setCodPrice(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
            placeholder={paySettings.codUnitPrice > 0 ? `Vacío = precio general ${paySettings.codUnitPrice}` : 'Ej: 68'}
          />
          <p className="mb-4 mt-1 text-xs text-muted">
            El cliente paga hoy {paySettings.codAdvance} USD para garantizar el envío y el resto al recibir. Déjalo vacío para usar el precio
            general de Configuración → Formas de pago.
          </p>

          <label className="mb-1 block text-sm font-semibold text-ink">Precio comparación (opcional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
            placeholder="Ej: 119.99 (se muestra tachado)"
          />

          <label className="mb-1 block text-sm font-semibold text-ink">Stock disponible</label>
          <input
            type="number"
            min="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
          />

          <label className="mb-1 block text-sm font-semibold text-ink">
            Unidades vendidas (opcional — dato real, se muestra como prueba social)
          </label>
          <input
            type="number"
            min="0"
            value={soldCount}
            onChange={(e) => setSoldCount(e.target.value)}
            className="w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
            placeholder="Ej: 34 (déjalo vacío si no lo sabes con certeza)"
          />
        </div>

        <div className="rounded-card bg-white p-6 shadow-soft">
          <h2 className="mb-4 font-heading text-lg font-bold text-ink">Organización</h2>
          <label className="mb-1 block text-sm font-semibold text-ink">Estilo / colección</label>
          <input
            list="collections"
            value={collectionName}
            onChange={(e) => setCollectionName(e.target.value)}
            className="mb-4 w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
          />
          <datalist id="collections">
            {COMMON_COLLECTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Destacado en inicio (Más vendidos)
          </label>
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
            Marcar como &quot;Nuevo&quot;
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Publicado (visible en la tienda)
          </label>
        </div>

        {error && <p className="rounded-lg bg-urgent/10 p-3 text-sm text-urgent">{error}</p>}

        <button type="submit" disabled={saving || uploading} className="btn-primary w-full disabled:opacity-60">
          {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Publicar producto'}
        </button>

        {isEditing && (
          <button type="button" onClick={handleDelete} className="w-full text-center text-sm font-semibold text-urgent">
            Eliminar producto
          </button>
        )}
      </div>
    </form>
  );
}
