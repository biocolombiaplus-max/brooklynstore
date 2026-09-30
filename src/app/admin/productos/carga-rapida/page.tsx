'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAdminUser } from '@/lib/admin-context';
import { detectShoeColors } from '@/lib/colorDetect';
import { resizeForUpload } from '@/lib/imageCrop';
import { createProduct, deleteProduct, updateProduct } from '@/lib/products';
import { useSiteSettings } from '@/lib/settings-context';
import { deleteProductImage, uploadProductImage } from '@/lib/storage';
import type { Gender, ProductColor, ProductInput } from '@/lib/types';
import QuickDraftCard, { COLLECTIONS, SIZE_PRESETS, type QuickDraft as Draft, type QuickPhoto as Photo } from '@/components/admin/QuickDraftCard';
import { classNames, slugify } from '@/lib/utils';

// Carga rápida: subir muchos productos de una sola vez con las fotos que
// ya tienes (por ejemplo, las que te llegan por WhatsApp). Eliges las fotos,
// las agrupas por modelo, completas lo mínimo (o con IA) y publicas todo.

let counter = 0;
const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}`;

function defaultDescription(d: Draft, colorNames: string[]): string {
  const name = d.title.trim() || 'Zapatos';
  const color = colorNames.length ? ` en ${colorNames.join(', ').toLowerCase()}` : '';
  return `${name}${color}. Comodidad, estilo y ligereza para tu día a día. Tallas para ${
    d.gender === 'mujer' ? 'mujer' : d.gender === 'hombre' ? 'hombre' : 'hombre y mujer'
  }, envío a todo el Ecuador con Servientrega y pago contra entrega.`;
}

// Colores del borrador: uno por color distinto (según el nombre).
function draftColorList(d: Draft, photo: (id: string) => Photo | undefined): { pid: string; name: string; hex: string; hex2?: string }[] {
  const list: { pid: string; name: string; hex: string; hex2?: string }[] = [];
  for (const pid of d.photoIds) {
    const detected = photo(pid)?.color ?? null;
    const c = pid in d.colorEdits ? d.colorEdits[pid] : detected;
    if (!c) continue;
    const name = c.name.trim() || 'Color';
    if (!list.some((x) => x.name.toLowerCase() === name.toLowerCase())) list.push({ pid, name, hex: c.hex, hex2: c.hex2 });
  }
  return list;
}

async function toBase64Jpeg(file: File, max = 1200): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  } finally {
    URL.revokeObjectURL(url);
  }
}

export default function CargaRapidaPage() {
  const user = useAdminUser();
  const { brands, payments } = useSiteSettings();
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [defaults, setDefaults] = useState({ brand: '', gender: 'hombre' as Gender, price: String(payments.defaultPrice || 59.9) });
  const [publishing, setPublishing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);

  const photoById = (id: string) => photos.find((p) => p.id === id);
  const usedIds = new Set(drafts.flatMap((d) => d.photoIds));
  const tray = photos.filter((p) => !usedIds.has(p.id));

  // Libera las vistas previas al salir.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), []);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const added: Photo[] = Array.from(list)
      .filter((f) => f.type.startsWith('image/'))
      .map((file) => ({ id: uid(), file, preview: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...added]);
    // Detecta el color de cada foto en segundo plano.
    for (const p of added) {
      const color = await detectShoeColors(p.file).catch(() => null);
      setPhotos((prev) => prev.map((x) => (x.id === p.id ? { ...x, color } : x)));
    }
  }

  function toggleSelect(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function newDraft(photoIds: string[]): Draft {
    return {
      id: uid(),
      photoIds,
      title: '',
      brand: defaults.brand,
      gender: defaults.gender,
      collection: 'urbanos',
      price: defaults.price,
      compareAtPrice: '',
      stock: '20',
      sizes: SIZE_PRESETS[defaults.gender],
      description: '',
      isNew: true,
      featured: false,
      active: true,
      colorEdits: {},
      status: 'draft',
    };
  }

  function createFromSelection() {
    if (!selected.length) return;
    setDrafts((d) => [newDraft(selected), ...d]);
    setSelected([]);
  }

  function eachPhotoAsProduct() {
    const ids = (selected.length ? selected : tray.map((p) => p.id)).slice();
    setDrafts((d) => [...ids.map((id) => newDraft([id])), ...d]);
    setSelected([]);
  }

  function updateDraft(id: string, patch: Partial<Draft>) {
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }

  function removeDraft(id: string) {
    setDrafts((ds) => ds.filter((d) => d.id !== id));
  }

  function removePhotoFromDraft(draftId: string, photoId: string) {
    setDrafts((ds) =>
      ds.flatMap((d) => {
        if (d.id !== draftId) return [d];
        const photoIds = d.photoIds.filter((p) => p !== photoId);
        return photoIds.length ? [{ ...d, photoIds }] : [];
      }),
    );
  }

  function makeCover(draftId: string, photoId: string) {
    setDrafts((ds) => ds.map((d) => (d.id === draftId ? { ...d, photoIds: [photoId, ...d.photoIds.filter((p) => p !== photoId)] } : d)));
  }

  function discardPhoto(id: string) {
    setPhotos((ps) => ps.filter((p) => p.id !== id));
    setSelected((s) => s.filter((x) => x !== id));
  }

  async function aiFill(draft: Draft) {
    const cover = photoById(draft.photoIds[0]);
    if (!cover || !user) return;
    updateDraft(draft.id, { ai: 'loading', aiNote: undefined });
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/describir-producto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image: await toBase64Jpeg(cover.file), brands }),
      });
      if (res.status === 503) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'not_configured') setAiAvailable(false);
        updateDraft(draft.id, { ai: 'error', aiNote: data.error === 'not_configured' ? 'La IA no está activada todavía.' : 'La IA está ocupada, intenta en un momento.' });
        return;
      }
      if (!res.ok) throw new Error();
      const { suggestion } = (await res.json()) as {
        suggestion: { title: string; brand: string; colorName: string; gender: Gender; collection: string; description: string };
      };
      const knownBrand = brands.find((b) => b.toLowerCase() === suggestion.brand.toLowerCase()) ?? suggestion.brand;
      updateDraft(draft.id, {
        title: suggestion.title,
        brand: knownBrand,
        gender: suggestion.gender,
        sizes: SIZE_PRESETS[suggestion.gender],
        collection: COLLECTIONS.includes(suggestion.collection) ? suggestion.collection : draft.collection,
        description: suggestion.description,
        ai: 'done',
        aiNote: `✨ Sugerido: ${suggestion.title} · ${suggestion.colorName}. Revísalo antes de publicar.`,
      });
    } catch {
      updateDraft(draft.id, { ai: 'error', aiNote: 'No pudimos autocompletar esta foto. Escribe los datos a mano.' });
    }
  }

  async function aiFillAll() {
    for (const d of drafts.filter((x) => x.status === 'draft' && !x.title.trim())) {
      // Uno por uno para no saturar.
      // eslint-disable-next-line no-await-in-loop
      await aiFill(d);
    }
  }

  async function publishOne(draft: Draft): Promise<void> {
    if (!draft.title.trim()) {
      updateDraft(draft.id, { status: 'error', error: 'Falta el nombre del producto.' });
      return;
    }
    updateDraft(draft.id, { status: 'saving', error: undefined });
    try {
      const base = slugify(draft.title) || `producto-${Date.now()}`;
      const images: string[] = [];
      const urlByPhoto: Record<string, string> = {};
      for (const pid of draft.photoIds) {
        const photo = photoById(pid);
        if (!photo) continue;
        const resized = await resizeForUpload(photo.file);
        const url = await uploadProductImage(new File([resized], photo.file.name || `${base}.jpg`, { type: 'image/jpeg' }), base, 'fill');
        images.push(url);
        urlByPhoto[pid] = url;
      }
      const colors: ProductColor[] = draftColorList(draft, photoById).map((c) =>
        c.hex2 && c.hex2.toLowerCase() !== c.hex.toLowerCase()
          ? { name: c.name, hex: c.hex, hex2: c.hex2, image: urlByPhoto[c.pid] }
          : { name: c.name, hex: c.hex, image: urlByPhoto[c.pid] },
      );

      const input: ProductInput = {
        slug: base,
        title: draft.title.trim(),
        brand: draft.brand.trim(),
        gender: draft.gender,
        fit: 'normal',
        isNew: draft.isNew,
        description: draft.description.trim() || defaultDescription(draft, colors.map((c) => c.name)),
        price: Number(draft.price) || payments.defaultPrice,
        compareAtPrice: Number(draft.compareAtPrice) > 0 ? Number(draft.compareAtPrice) : null,
        codPrice: null,
        images,
        sizes: draft.sizes,
        colors,
        collection: draft.collection,
        stock: Number(draft.stock) || 0,
        featured: draft.featured,
        active: draft.active,
        soldCount: 0,
        reviewsCount: 0,
        reviews: [],
      };

      // Si la URL ya existe (mismo modelo en otro color), se le agrega un número.
      let created: { id: string; slug: string } | null = null;
      let lastError: unknown = null;
      for (let n = 1; n <= 20 && !created; n++) {
        const slug = n === 1 ? base : `${base}-${n}`;
        try {
          created = { id: await createProduct({ ...input, slug }), slug };
        } catch (err) {
          lastError = err;
          if (!(err instanceof Error && err.message.includes('Ya existe'))) break;
        }
      }
      if (!created) throw lastError;
      updateDraft(draft.id, {
        status: 'done',
        productId: created.id,
        slug: created.slug,
        images,
        colors,
        description: input.description,
        expanded: false,
      });
    } catch (err) {
      updateDraft(draft.id, { status: 'error', error: err instanceof Error ? err.message : 'No se pudo publicar. Intenta de nuevo.' });
    }
  }

  // Guarda los cambios de un producto ya publicado.
  async function saveEdit(draft: Draft) {
    if (!draft.productId) return;
    if (!draft.title.trim()) {
      updateDraft(draft.id, { error: 'El nombre no puede quedar vacío.' });
      return;
    }
    updateDraft(draft.id, { savingEdit: true, error: undefined });
    try {
      await updateProduct(draft.productId, {
        title: draft.title.trim(),
        brand: draft.brand.trim(),
        gender: draft.gender,
        collection: draft.collection,
        price: Number(draft.price) || payments.defaultPrice,
        compareAtPrice: Number(draft.compareAtPrice) > 0 ? Number(draft.compareAtPrice) : null,
        stock: Number(draft.stock) || 0,
        sizes: draft.sizes,
        colors: (draft.colors ?? []).map((c) => ({ ...c, name: c.name.trim() || 'Color' })),
        description: draft.description.trim() || defaultDescription(draft, (draft.colors ?? []).map((c) => c.name)),
        isNew: draft.isNew,
        featured: draft.featured,
        active: draft.active,
      });
      updateDraft(draft.id, { savingEdit: false, editing: false, note: '✓ Cambios guardados en la tienda.' });
    } catch (err) {
      updateDraft(draft.id, { savingEdit: false, error: err instanceof Error ? err.message : 'No se pudieron guardar los cambios.' });
    }
  }

  // Elimina de la tienda un producto recién publicado (y sus fotos).
  async function deletePublished(draft: Draft) {
    if (!draft.productId) return;
    if (!confirm(`¿Eliminar "${draft.title}" de la tienda? Esta acción no se puede deshacer.`)) return;
    updateDraft(draft.id, { deleting: true });
    try {
      await deleteProduct(draft.productId);
      (draft.images ?? []).forEach((url) => deleteProductImage(url).catch(() => {}));
      setDrafts((ds) => ds.filter((x) => x.id !== draft.id));
      setPhotos((ps) => ps.filter((p) => !draft.photoIds.includes(p.id)));
    } catch {
      updateDraft(draft.id, { deleting: false, note: undefined, error: 'No se pudo eliminar. Intenta de nuevo.' });
    }
  }

  async function publishAll() {
    setPublishing(true);
    for (const d of drafts.filter((x) => x.status === 'draft' || x.status === 'error')) {
      // eslint-disable-next-line no-await-in-loop
      await publishOne(d);
    }
    setPublishing(false);
  }

  const pending = drafts.filter((d) => d.status === 'draft' || d.status === 'error');
  const doneCount = drafts.filter((d) => d.status === 'done').length;
  const missingTitle = pending.filter((d) => !d.title.trim()).length;

  return (
    <div className="pb-32">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/productos" className="text-xs font-bold text-muted hover:text-ink">
            ← Productos
          </Link>
          <h1 className="mt-1 font-heading text-2xl font-bold text-ink">⚡ Carga rápida</h1>
          <p className="text-sm text-muted">Sube muchos productos de una sola vez con tus fotos de WhatsApp.</p>
        </div>
      </div>

      {/* Paso 1: fotos */}
      <section className="rounded-card bg-white p-5 shadow-soft sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold text-ink">1. Elige tus fotos</h2>
          {photos.length > 0 && <span className="text-xs font-bold text-muted">{tray.length} sin asignar · {photos.length} en total</span>}
        </div>

        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-primary/50 bg-gold-50 px-4 py-8 text-center transition-colors hover:bg-gold-100"
        >
          <span className="text-3xl">📥</span>
          <span className="text-base font-black uppercase text-ink">Elegir fotos</span>
          <span className="text-xs text-muted">Puedes seleccionar muchas a la vez desde tu galería</span>
        </button>

        <details className="mt-3 rounded-xl bg-cream-alt/60 px-4 py-3 text-xs text-muted">
          <summary className="cursor-pointer font-bold text-ink">¿Cómo paso las fotos de WhatsApp a mi galería?</summary>
          <ul className="mt-2 space-y-1.5">
            <li>
              <strong className="text-ink">iPhone:</strong> abre el chat → toca el nombre del contacto → Archivos, enlaces y documentos → Seleccionar →
              marca las fotos → compartir → <em>Guardar imágenes</em>.
            </li>
            <li>
              <strong className="text-ink">Android:</strong> las fotos de WhatsApp ya están en tu galería (álbum <em>WhatsApp Images</em>). Aquí
              solo tócalas para seleccionarlas.
            </li>
            <li>
              <strong className="text-ink">Computador:</strong> en WhatsApp Web selecciona las fotos y descárgalas; luego elígelas aquí.
            </li>
            <li>💡 Tip: en WhatsApp envía las fotos como <em>documento</em> para que no pierdan calidad.</li>
          </ul>
        </details>

        {tray.length > 0 && (
          <>
            <p className="mt-5 text-xs font-bold text-ink">
              2. Toca las fotos de un mismo modelo (en el orden que quieras mostrarlas) y crea el producto:
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {tray.map((p) => {
                const order = selected.indexOf(p.id);
                return (
                  <div key={p.id} className="relative">
                    <button
                      type="button"
                      onClick={() => toggleSelect(p.id)}
                      className={classNames(
                        'relative block aspect-square w-full overflow-hidden rounded-xl ring-2 transition-all',
                        order >= 0 ? 'ring-primary ring-offset-2' : 'ring-transparent',
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt="" className="h-full w-full object-cover" />
                      {order >= 0 && (
                        <span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                          {order + 1}
                        </span>
                      )}
                      {p.color && (
                        <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full ring-2 ring-white" style={{ background: p.color.hex }} title={p.color.name} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => discardPhoto(p.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white"
                      aria-label="Descartar foto"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={createFromSelection} disabled={!selected.length} className="btn-primary flex-1 disabled:opacity-40">
                ➕ Crear producto {selected.length ? `con ${selected.length} foto${selected.length > 1 ? 's' : ''}` : ''}
              </button>
              <button type="button" onClick={eachPhotoAsProduct} className="btn-secondary flex-1">
                {selected.length ? `Cada foto seleccionada = 1 producto` : `Cada foto = 1 producto (${tray.length})`}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Si un modelo viene en varios colores, pon todas sus fotos en el mismo producto: detectamos cada color y lo dejamos listo con su foto.
            </p>
          </>
        )}
      </section>

      {/* Valores por defecto */}
      <section className="mt-5 rounded-card bg-white p-5 shadow-soft sm:p-6">
        <h2 className="font-heading text-lg font-bold text-ink">Valores para los nuevos productos</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-xs font-bold text-ink">
            Marca
            <input list="qb-brands" value={defaults.brand} onChange={(e) => setDefaults({ ...defaults, brand: e.target.value })} placeholder="Ej: Nike" className="input mt-1" />
          </label>
          <label className="text-xs font-bold text-ink">
            Género
            <select value={defaults.gender} onChange={(e) => setDefaults({ ...defaults, gender: e.target.value as Gender })} className="input mt-1 bg-white">
              <option value="hombre">Hombre</option>
              <option value="mujer">Mujer</option>
              <option value="unisex">Unisex</option>
            </select>
          </label>
          <label className="text-xs font-bold text-ink">
            Precio (USD)
            <input inputMode="decimal" value={defaults.price} onChange={(e) => setDefaults({ ...defaults, price: e.target.value })} className="input mt-1" />
          </label>
        </div>
        <datalist id="qb-brands">
          {brands.map((b) => (
            <option key={b} value={b} />
          ))}
        </datalist>
      </section>

      {/* Borradores y publicados */}
      {drafts.length > 0 && (
        <section className="mt-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-lg font-bold text-ink">
              3. Revisa y publica ({pending.length} por publicar{doneCount ? ` · ${doneCount} publicados` : ''})
            </h2>
            {aiAvailable && pending.some((d) => !d.title.trim()) && (
              <button type="button" onClick={aiFillAll} className="rounded-full bg-ink px-4 py-2 text-xs font-extrabold text-white">
                ✨ Autocompletar todos con IA
              </button>
            )}
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-2">
            {drafts.map((d) => (
              <QuickDraftCard
                key={d.id}
                draft={d}
                photo={photoById}
                aiAvailable={aiAvailable}
                busy={publishing}
                onChange={(patch) => updateDraft(d.id, patch)}
                onAi={() => aiFill(d)}
                onPublish={() => publishOne(d)}
                onRemovePhoto={(pid) => removePhotoFromDraft(d.id, pid)}
                onMakeCover={(pid) => makeCover(d.id, pid)}
                onDiscard={() => removeDraft(d.id)}
                onSaveEdit={() => saveEdit(d)}
                onDelete={() => deletePublished(d)}
                onDefaultDescription={() =>
                  defaultDescription(d, d.status === 'done' ? (d.colors ?? []).map((c) => c.name) : draftColorList(d, photoById).map((c) => c.name))
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* Barra de publicar */}
      {pending.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.06)] backdrop-blur sm:pl-60">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <p className="hidden flex-1 text-xs text-muted sm:block">
              {missingTitle ? `A ${missingTitle} producto(s) les falta el nombre.` : 'Todo listo para publicar.'}
            </p>
            <button type="button" onClick={publishAll} disabled={publishing} className="btn-primary btn-shine flex-1 py-3.5 disabled:opacity-60 sm:flex-none sm:px-10">
              {publishing ? 'Publicando...' : `🚀 Publicar ${pending.length} producto${pending.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
      {!pending.length && doneCount > 0 && (
        <div className="mt-6 rounded-card bg-[#0a0a0a] p-6 text-center text-white">
          <p className="text-lg font-black uppercase">🎉 ¡{doneCount} producto{doneCount > 1 ? 's' : ''} publicado{doneCount > 1 ? 's' : ''}!</p>
          <p className="mt-1 text-sm text-white/65">Ya están en tu tienda. Puedes editar precios, descripciones o reseñas desde Productos.</p>
          <Link href="/admin/productos" className="btn-primary mt-4">
            Ver mis productos
          </Link>
        </div>
      )}
    </div>
  );
}
