'use client';

import Link from 'next/link';
import { swatchBackground } from '@/components/ColorSwatch';
import type { Gender, ProductColor } from '@/lib/types';
import { classNames, formatPrice } from '@/lib/utils';

export interface QuickPhoto {
  id: string;
  file: File;
  preview: string;
  color?: { name: string; hex: string; hex2?: string } | null;
}

export interface QuickDraft {
  id: string;
  photoIds: string[];
  title: string;
  brand: string;
  gender: Gender;
  collection: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  sizes: string[];
  description: string;
  isNew: boolean;
  featured: boolean;
  active: boolean;
  // Nombre de color editado por foto (antes de publicar).
  colorNames: Record<string, string>;
  status: 'draft' | 'saving' | 'done' | 'error';
  error?: string;
  ai?: 'loading' | 'done' | 'error';
  aiNote?: string;
  expanded?: boolean;
  // Después de publicar
  productId?: string;
  slug?: string;
  images?: string[];
  colors?: ProductColor[];
  editing?: boolean;
  savingEdit?: boolean;
  note?: string;
  deleting?: boolean;
}

export const SIZE_PRESETS: Record<Gender, string[]> = {
  hombre: ['38', '39', '40', '41', '42', '43', '44'],
  mujer: ['35', '36', '37', '38', '39', '40'],
  unisex: ['36', '37', '38', '39', '40', '41', '42', '43'],
};
const ALL_SIZES = ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
export const COLLECTIONS = ['deportivos', 'urbanos', 'running', 'basket', 'sandalias', 'botas'];

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={classNames(
        'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ring-1 transition-colors',
        checked ? 'bg-ink text-white ring-ink' : 'bg-white text-muted ring-border',
      )}
    >
      <span className={classNames('h-3.5 w-3.5 rounded-full ring-2', checked ? 'bg-primary ring-primary' : 'ring-border')} />
      {label}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-muted">{children}</span>;
}

export default function QuickDraftCard({
  draft: d,
  photo,
  aiAvailable,
  busy,
  onChange,
  onAi,
  onPublish,
  onRemovePhoto,
  onMakeCover,
  onDiscard,
  onSaveEdit,
  onDelete,
  onDefaultDescription,
}: {
  draft: QuickDraft;
  photo: (id: string) => QuickPhoto | undefined;
  aiAvailable: boolean;
  busy: boolean;
  onChange: (patch: Partial<QuickDraft>) => void;
  onAi: () => void;
  onPublish: () => void;
  onRemovePhoto: (photoId: string) => void;
  onMakeCover: (photoId: string) => void;
  onDiscard: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onDefaultDescription: () => string;
}) {
  const published = d.status === 'done';
  const editable = !published || d.editing;
  const saving = d.status === 'saving' || d.savingEdit;
  const cover = published ? d.images?.[0] : photo(d.photoIds[0])?.preview;

  // Colores: antes de publicar salen de las fotos (uno por color distinto);
  // después, del producto guardado.
  const draftColors = d.photoIds
    .map((pid) => ({ pid, p: photo(pid) }))
    .filter((x) => x.p?.color)
    .map((x) => ({ pid: x.pid, hex: x.p!.color!.hex, hex2: x.p!.color!.hex2, name: d.colorNames[x.pid] ?? x.p!.color!.name }));

  return (
    <article
      className={classNames(
        'overflow-hidden rounded-card bg-white shadow-soft ring-1 transition-shadow',
        published ? 'ring-whatsapp/40' : d.status === 'error' ? 'ring-urgent/50' : 'ring-border',
      )}
    >
      {/* Cabecera */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream-alt ring-1 ring-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {published ? (
              <span className="rounded-full bg-whatsapp/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-whatsapp">✓ Publicado</span>
            ) : d.status === 'error' ? (
              <span className="rounded-full bg-urgent/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-urgent">Revisar</span>
            ) : (
              <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-primary-hover">Borrador</span>
            )}
            {published && !d.active && <span className="rounded-full bg-cream-alt px-2 py-0.5 text-[10px] font-bold text-muted">Oculto</span>}
            {d.featured && <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-primary-light">★ Destacado</span>}
          </div>
          <p className="mt-1 truncate text-sm font-black text-ink">{d.title || 'Sin nombre todavía'}</p>
          <p className="truncate text-xs text-muted">
            {[d.brand, d.gender === 'hombre' ? 'Hombre' : d.gender === 'mujer' ? 'Mujer' : 'Unisex', formatPrice(Number(d.price) || 0)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {/* Acciones de un producto publicado */}
      {published && !d.editing && (
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
          <button type="button" onClick={() => onChange({ editing: true, note: undefined })} className="rounded-xl bg-ink px-3 py-2.5 text-xs font-extrabold text-white">
            ✏️ Editar
          </button>
          <Link href={`/producto/${d.slug}`} target="_blank" className="rounded-xl bg-cream-alt px-3 py-2.5 text-center text-xs font-extrabold text-ink">
            👁 Ver en tienda
          </Link>
          <Link href={`/admin/productos/${d.productId}`} target="_blank" className="rounded-xl bg-cream-alt px-3 py-2.5 text-center text-xs font-extrabold text-ink">
            ⚙️ Editor completo
          </Link>
          <button type="button" onClick={onDelete} disabled={d.deleting} className="rounded-xl bg-urgent/10 px-3 py-2.5 text-xs font-extrabold text-urgent disabled:opacity-50">
            {d.deleting ? 'Eliminando...' : '🗑 Eliminar'}
          </button>
          {d.note && <p className="col-span-full text-xs font-semibold text-whatsapp">{d.note}</p>}
        </div>
      )}

      {editable && (
        <div className="space-y-4 p-4">
          {/* Fotos (antes de publicar) */}
          {!published && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {d.photoIds.map((pid, i) => {
                const p = photo(pid);
                if (!p) return null;
                return (
                  <div key={pid} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => onMakeCover(pid)}
                      title="Usar como portada"
                      className={classNames('block h-20 w-20 overflow-hidden rounded-xl ring-2', i === 0 ? 'ring-primary' : 'ring-border')}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.preview} alt="" className="h-full w-full object-cover" />
                    </button>
                    {i === 0 && <span className="absolute inset-x-0 bottom-0 rounded-b-xl bg-ink/70 py-0.5 text-center text-[9px] font-bold text-white">Portada</span>}
                    {!saving && (
                      <button
                        type="button"
                        onClick={() => onRemovePhoto(pid)}
                        className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-white"
                        aria-label="Quitar foto"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div>
            <Label>Nombre del producto</Label>
            <div className="flex gap-2">
              <input
                value={d.title}
                onChange={(e) => onChange({ title: e.target.value, status: d.status === 'error' ? 'draft' : d.status })}
                placeholder="Ej: On Cloud 6"
                className={classNames('input flex-1', d.status === 'error' && !d.title.trim() && 'border-urgent')}
                disabled={saving}
              />
              {aiAvailable && !published && (
                <button
                  type="button"
                  onClick={onAi}
                  disabled={d.ai === 'loading' || saving}
                  title="Autocompletar con IA desde la foto"
                  className="shrink-0 rounded-xl bg-ink px-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {d.ai === 'loading' ? '⏳' : '✨ IA'}
                </button>
              )}
            </div>
            {d.aiNote && !published && (
              <p className={classNames('mt-1.5 text-[11px] font-semibold', d.ai === 'error' ? 'text-urgent' : 'text-primary-hover')}>{d.aiNote}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <Label>Marca</Label>
              <input list="qb-brands" value={d.brand} onChange={(e) => onChange({ brand: e.target.value })} className="input" disabled={saving} />
            </label>
            <label>
              <Label>Género</Label>
              <select
                value={d.gender}
                onChange={(e) => {
                  const g = e.target.value as Gender;
                  onChange({ gender: g, sizes: SIZE_PRESETS[g] });
                }}
                className="input bg-white"
                disabled={saving}
              >
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
                <option value="unisex">Unisex</option>
              </select>
            </label>
            <label>
              <Label>Precio</Label>
              <input inputMode="decimal" value={d.price} onChange={(e) => onChange({ price: e.target.value })} className="input" disabled={saving} />
            </label>
            <label>
              <Label>Estilo</Label>
              <select value={d.collection} onChange={(e) => onChange({ collection: e.target.value })} className="input bg-white capitalize" disabled={saving}>
                {COLLECTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <Label>Tallas disponibles (EC)</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={saving}
                  onClick={() =>
                    onChange({ sizes: d.sizes.includes(s) ? d.sizes.filter((x) => x !== s) : [...d.sizes, s].sort((a, b) => Number(a) - Number(b)) })
                  }
                  className={classNames('h-9 w-10 rounded-lg text-xs font-bold transition-colors', d.sizes.includes(s) ? 'bg-ink text-white' : 'bg-cream-alt text-muted')}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Colores */}
          {(published ? (d.colors ?? []).length > 0 : draftColors.length > 0) && (
            <div>
              <Label>Colores (puedes renombrarlos)</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {published
                  ? (d.colors ?? []).map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="h-7 w-7 shrink-0 rounded-full ring-1 ring-border" style={{ background: swatchBackground(c.hex, c.hex2) }} />
                        <input
                          value={c.name}
                          onChange={(e) => onChange({ colors: (d.colors ?? []).map((x, j) => (j === i ? { ...x, name: e.target.value } : x)) })}
                          className="input py-2"
                          disabled={saving}
                        />
                        <button
                          type="button"
                          onClick={() => onChange({ colors: (d.colors ?? []).filter((_, j) => j !== i) })}
                          className="shrink-0 text-sm text-urgent"
                          aria-label="Quitar color"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  : draftColors.map((c) => (
                      <div key={c.pid} className="flex items-center gap-2">
                        <span className="h-7 w-7 shrink-0 rounded-full ring-1 ring-border" style={{ background: swatchBackground(c.hex, c.hex2) }} />
                        <input
                          value={c.name}
                          onChange={(e) => onChange({ colorNames: { ...d.colorNames, [c.pid]: e.target.value } })}
                          className="input py-2"
                          disabled={saving}
                        />
                      </div>
                    ))}
              </div>
              {!published && <p className="mt-1 text-[10px] text-muted">Fotos con el mismo nombre de color se agrupan en un solo color.</p>}
            </div>
          )}

          {/* Más detalles */}
          <button
            type="button"
            onClick={() => onChange({ expanded: !d.expanded })}
            className="flex w-full items-center justify-between rounded-xl bg-cream-alt/70 px-3 py-2.5 text-xs font-extrabold text-ink"
          >
            <span>📝 Descripción, precio anterior, stock y visibilidad</span>
            <span className={classNames('transition-transform', d.expanded && 'rotate-180')}>▾</span>
          </button>

          {d.expanded && (
            <div className="animate-slideUp space-y-3">
              <label className="block">
                <span className="mb-1 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted">Descripción</span>
                  <button type="button" onClick={() => onChange({ description: onDefaultDescription() })} className="text-[11px] font-bold text-primary-hover">
                    ✨ Generar texto
                  </button>
                </span>
                <textarea
                  value={d.description}
                  onChange={(e) => onChange({ description: e.target.value })}
                  rows={4}
                  placeholder="Si lo dejas vacío, escribimos una descripción de venta automática."
                  className="input resize-y"
                  disabled={saving}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <Label>Precio antes (tachado)</Label>
                  <input inputMode="decimal" value={d.compareAtPrice} onChange={(e) => onChange({ compareAtPrice: e.target.value })} placeholder="Ej: 89.90" className="input" disabled={saving} />
                </label>
                <label>
                  <Label>Stock</Label>
                  <input inputMode="numeric" value={d.stock} onChange={(e) => onChange({ stock: e.target.value.replace(/\D/g, '') })} className="input" disabled={saving} />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Toggle label="Visible en la tienda" checked={d.active} onChange={(v) => onChange({ active: v })} />
                <Toggle label="Etiqueta Nuevo" checked={d.isNew} onChange={(v) => onChange({ isNew: v })} />
                <Toggle label="Destacado en inicio" checked={d.featured} onChange={(v) => onChange({ featured: v })} />
              </div>
            </div>
          )}

          {d.error && <p className="rounded-xl bg-urgent/10 p-3 text-xs font-semibold text-urgent">{d.error}</p>}

          {/* Botones */}
          {published ? (
            <div className="flex gap-2">
              <button type="button" onClick={() => onChange({ editing: false })} disabled={saving} className="btn-secondary flex-1 py-3 text-xs">
                Cancelar
              </button>
              <button type="button" onClick={onSaveEdit} disabled={saving} className="btn-primary flex-1 py-3 text-xs disabled:opacity-50">
                {d.savingEdit ? 'Guardando...' : '💾 Guardar cambios'}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={onDiscard} disabled={saving} className="rounded-xl px-3 py-3 text-xs font-bold text-muted hover:text-urgent">
                🗑 Quitar del lote
              </button>
              <button type="button" onClick={onPublish} disabled={saving || busy} className="btn-primary flex-1 py-3 text-xs disabled:opacity-50">
                {d.status === 'saving' ? 'Publicando...' : '🚀 Publicar este'}
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
