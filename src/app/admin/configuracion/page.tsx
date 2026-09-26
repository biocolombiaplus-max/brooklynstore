'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, getSiteSettings, updateSiteSettings } from '@/lib/settings';
import { uploadProductImage } from '@/lib/storage';
import { getProvinces } from '@/lib/ecuador';
import { FONT_GROUPS, ALL_CURATED_FONTS, googleFontsHref, fontFamilyValue } from '@/lib/fonts';
import type {
  SiteSettings,
  TrustItem,
  BenefitItem,
  TestimonialItem,
  ProvinceRate,
  BankAccount,
  FaqItem,
  CollectionMenuItem,
} from '@/lib/types';

const PROVINCES = getProvinces();

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card bg-white p-6 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-ink">{title}</h2>
          {description && <p className="mt-1 text-xs text-muted">{description}</p>}
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-ink">{label}</label>
      {children}
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none';

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-ink">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded border border-border"
        />
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
      </div>
    </div>
  );
}

function FontPicker({
  label,
  value,
  onChange,
  previewFallback,
}: {
  label: string;
  value: string;
  onChange: (font: string) => void;
  previewFallback: 'serif' | 'sans-serif';
}) {
  const [customMode, setCustomMode] = useState(() => !!value && !ALL_CURATED_FONTS.includes(value));

  // Carga la fuente elegida solo para poder mostrarla en la vista previa de
  // aquí abajo — el cambio real en todo el sitio ocurre al Guardar cambios.
  useEffect(() => {
    if (!value) return;
    const id = `font-preview-${value.replace(/\s+/g, '-')}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = googleFontsHref([value]);
    document.head.appendChild(link);
  }, [value]);

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-ink">{label}</label>
      {!customMode ? (
        <select
          value={value}
          onChange={(e) => (e.target.value === '__custom__' ? setCustomMode(true) : onChange(e.target.value))}
          className={`${inputClass} bg-white`}
        >
          {FONT_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.fonts.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </optgroup>
          ))}
          <option value="__custom__">✏️ Otra (escribir el nombre)...</option>
        </select>
      ) : (
        <div className="flex gap-2">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Nombre exacto en Google Fonts (ej: Josefin Sans)"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setCustomMode(false)}
            className="shrink-0 text-xs font-semibold text-primary hover:underline"
          >
            Ver lista
          </button>
        </div>
      )}
      {customMode && (
        <p className="mt-1 text-xs text-muted">
          Escribe el nombre tal cual aparece en{' '}
          <a href="https://fonts.google.com" target="_blank" rel="noopener noreferrer" className="underline">
            fonts.google.com
          </a>
          .
        </p>
      )}
      <p
        className="mt-2 truncate rounded-lg border border-border bg-cream-alt/40 px-3 py-3 text-xl"
        style={{ fontFamily: fontFamilyValue(value, previewFallback) }}
      >
        {value || 'Elige una fuente'} — Aa Bb Cc 123
      </p>
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  folder,
  onChange,
}: {
  label: string;
  value: string;
  folder: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProductImage(file, folder, 'original');
      onChange(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        {value && (
          <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border bg-cream-alt">
            <Image src={value} alt="" fill className="object-cover" />
          </div>
        )}
        <label className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink hover:border-primary">
          {uploading ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Subir imagen'}
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} className="text-xs text-urgent">
            Quitar
          </button>
        )}
      </div>
    </Field>
  );
}

// Varias fotos que rotan solas en el hero — misma idea que "Fotos del
// producto" (subir varias a la vez, quitar una por una), pero guardando
// un arreglo de URLs en vez de una sola imagen.
function MultiImageUploadField({
  label,
  help,
  values,
  folder,
  onChange,
}: {
  label: string;
  help?: string;
  values: string[];
  folder: string;
  onChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError('');
    const queued = Array.from(files);
    e.target.value = '';

    setUploading(true);
    try {
      for (const file of queued) {
        try {
          const url = await uploadProductImage(file, folder, 'original');
          onChange([...values, url]);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : 'No se pudo subir la foto. Intenta de nuevo.');
        }
      }
    } finally {
      setUploading(false);
    }
  }

  function removeAt(url: string) {
    onChange(values.filter((v) => v !== url));
  }

  return (
    <Field label={label}>
      <div className="mb-2 flex flex-wrap gap-3">
        {values.map((url, i) => (
          <div key={url + i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-cream-alt">
            <Image src={url} alt="" fill className="object-cover" />
            {i === 0 && (
              <span className="absolute bottom-0 left-0 right-0 bg-ink/70 py-0.5 text-center text-[9px] font-bold text-white">
                Portada
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(url)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/80 text-xs text-white"
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}
        <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-center text-[11px] text-muted hover:border-primary">
          {uploading ? 'Subiendo...' : '+ Agregar'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} disabled={uploading} />
        </label>
      </div>
      {uploadError && <p className="mb-1 text-xs text-urgent">{uploadError}</p>}
      {help && <p className="text-xs text-muted">{help}</p>}
    </Field>
  );
}

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS));
  }, []);

  if (!settings) {
    return <p className="text-muted">Cargando configuración...</p>;
  }

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  function updateNested<K extends 'colors' | 'fonts' | 'hero' | 'cta' | 'footer', F extends keyof SiteSettings[K]>(
    key: K,
    field: F,
    value: SiteSettings[K][F],
  ) {
    setSettings((s) => (s ? { ...s, [key]: { ...s[key], [field]: value } } : s));
  }

  function updateShipping<F extends keyof SiteSettings['shipping']>(field: F, value: SiteSettings['shipping'][F]) {
    setSettings((s) => (s ? { ...s, shipping: { ...s.shipping, [field]: value } } : s));
  }

  function updateFeatured<F extends keyof SiteSettings['featuredBrand']>(field: F, value: SiteSettings['featuredBrand'][F]) {
    setSettings((s) => (s ? { ...s, featuredBrand: { ...s.featuredBrand, [field]: value } } : s));
  }

  function updatePayments<F extends keyof SiteSettings['payments']>(field: F, value: SiteSettings['payments'][F]) {
    setSettings((s) => (s ? { ...s, payments: { ...s.payments, [field]: value } } : s));
  }

  function resetColors() {
    if (!confirm('¿Restablecer los colores a los valores originales de la tienda? Se aplica al Guardar cambios.')) return;
    setSettings((s) => (s ? { ...s, colors: DEFAULT_SETTINGS.colors } : s));
  }

  function resetFonts() {
    if (!confirm('¿Restablecer la tipografía a las fuentes originales de la tienda? Se aplica al Guardar cambios.')) return;
    setSettings((s) => (s ? { ...s, fonts: DEFAULT_SETTINGS.fonts } : s));
  }

  async function resetDesignToDefaults() {
    if (!settings) return;
    if (
      !confirm(
        '¿Restablecer el diseño (colores, tipografía y tamaño del logo) a los valores originales de la tienda? Esto se guarda de inmediato, sin afectar tus textos, testimonios ni demás contenido.',
      )
    )
      return;
    const restored: SiteSettings = {
      ...settings,
      colors: DEFAULT_SETTINGS.colors,
      fonts: DEFAULT_SETTINGS.fonts,
      logoHeight: DEFAULT_SETTINGS.logoHeight,
    };
    setSettings(restored);
    setSaving(true);
    try {
      await updateSiteSettings(restored);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSiteSettings({
        ...settings,
        brands: settings.brands.map((b) => b.trim()).filter(Boolean),
        featuredBrand: {
          ...settings.featuredBrand,
          name: settings.featuredBrand.name.trim(),
          bullets: settings.featuredBrand.bullets.map((b) => b.trim()).filter(Boolean),
        },
        announcementMessages: settings.announcementMessages.map((m) => m.trim()).filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="font-heading text-2xl font-bold text-ink">Configuración del sitio</h1>
        <p className="text-sm text-muted">Edita textos, imágenes, colores y contacto sin tocar código</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border-2 border-dashed border-urgent/40 bg-urgent/5 p-4">
        <div>
          <p className="text-sm font-bold text-ink">¿Algo se desordenó? (colores, logo, letras)</p>
          <p className="text-xs text-muted">
            Este botón vuelve de inmediato a los colores, tipografía y tamaño del logo originales de la tienda —
            sin borrar tus textos, testimonios ni ninguna otra configuración.
          </p>
        </div>
        <button
          type="button"
          onClick={resetDesignToDefaults}
          disabled={saving}
          className="shrink-0 whitespace-nowrap rounded-lg bg-urgent px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-transform hover:scale-105 disabled:opacity-60"
        >
          ↺ Volver a ajustes originales
        </button>
      </div>

      <Section title="General" description="Nombre de la tienda, logo y WhatsApp">
        <Field label="Nombre de la tienda">
          <input
            value={settings.storeName}
            onChange={(e) => update('storeName', e.target.value)}
            className={inputClass}
          />
        </Field>
        <ImageUploadField
          label="Logo (opcional — si no subes uno, se muestra el nombre en texto)"
          value={settings.logoUrl}
          folder="site"
          onChange={(url) => update('logoUrl', url)}
        />
        <Field label="Tamaño del logo en el encabezado (alto en píxeles, 40-140)">
          <input
            type="number"
            min={40}
            max={140}
            value={settings.logoHeight}
            onChange={(e) => update('logoHeight', Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Código de país WhatsApp">
            <input
              value={settings.whatsappCountryCode}
              onChange={(e) => update('whatsappCountryCode', e.target.value)}
              className={inputClass}
              placeholder="593"
            />
          </Field>
          <Field label="Número de WhatsApp (sin código de país)">
            <input
              value={settings.whatsappNumber}
              onChange={(e) => update('whatsappNumber', e.target.value)}
              className={inputClass}
              placeholder="0991234567"
            />
          </Field>
        </div>
        <Field label="Correo para recibir notificación de cada pedido nuevo">
          <input
            type="email"
            value={settings.notificationEmail}
            onChange={(e) => update('notificationEmail', e.target.value)}
            className={inputClass}
            placeholder="pedidos@tunegocio.com"
          />
          <p className="mt-1 text-xs text-muted">
            Cada vez que alguien complete un pedido, te llega un correo con el detalle — igual que las
            notificaciones de Shopify. Requiere tener configurado RESEND_API_KEY en el servidor (ver README.md).
          </p>
        </Field>
      </Section>

      <Section
        title="Formas de pago"
        description="Los dos métodos de la tienda. Todos los pedidos se confirman por WhatsApp y, en la página de confirmación, el cliente ve estas cuentas bancarias con botón para copiar el número."
      >
        <label className="flex items-center gap-3 rounded-lg bg-cream-alt/60 p-3 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={settings.payments.codEnabled}
            onChange={(e) => updatePayments('codEnabled', e.target.checked)}
          />
          Ofrecer pago contra entrega
        </label>
        <Field label="Contra entrega: lo que el cliente paga HOY para garantizar el envío (USD)">
          <input
            type="number"
            min={0}
            step="0.01"
            value={settings.payments.codAdvance}
            onChange={(e) => updatePayments('codAdvance', Number(e.target.value))}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-muted">
            Ej: 5 → el cliente adelanta $5 del envío y paga el valor de los productos en efectivo al recibir. Este valor
            aparece en el botón de contra entrega, en el checkout y en el mensaje de WhatsApp.
          </p>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Precio general por transferencia (USD, se sugiere al crear productos)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={settings.payments.defaultPrice}
              onChange={(e) => updatePayments('defaultPrice', Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Precio general contra entrega por par (USD, envío incluido; 0 = precio + envío)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={settings.payments.codUnitPrice}
              onChange={(e) => updatePayments('codUnitPrice', Number(e.target.value))}
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Cuentas bancarias para transferencias y depósitos</p>
          <ListEditor<BankAccount>
            items={settings.payments.bankAccounts}
            onChange={(items) => updatePayments('bankAccounts', items)}
            empty={{ bank: '', type: 'Cuenta de ahorros', number: '', holder: '', idNumber: '' }}
            renderRow={(item, onEdit) => (
              <div className="grid w-full gap-2 sm:grid-cols-2">
                <input
                  list="ec-banks"
                  value={item.bank}
                  onChange={(e) => onEdit({ ...item, bank: e.target.value })}
                  className={inputClass}
                  placeholder="Banco (ej: Banco Pichincha)"
                />
                <select value={item.type} onChange={(e) => onEdit({ ...item, type: e.target.value })} className={`${inputClass} bg-white`}>
                  <option>Cuenta de ahorros</option>
                  <option>Cuenta corriente</option>
                </select>
                <input
                  value={item.number}
                  onChange={(e) => onEdit({ ...item, number: e.target.value })}
                  className={inputClass}
                  placeholder="Número de cuenta"
                />
                <input
                  value={item.holder}
                  onChange={(e) => onEdit({ ...item, holder: e.target.value })}
                  className={inputClass}
                  placeholder="Titular"
                />
                <input
                  value={item.idNumber}
                  onChange={(e) => onEdit({ ...item, idNumber: e.target.value })}
                  className={`${inputClass} sm:col-span-2`}
                  placeholder="Cédula o RUC del titular"
                />
              </div>
            )}
          />
          <datalist id="ec-banks">
            <option value="Banco Pichincha" />
          </datalist>
        </div>

        <Field label="Mensaje debajo de las cuentas (página de confirmación)">
          <input
            value={settings.payments.transferNote}
            onChange={(e) => updatePayments('transferNote', e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section
        title="Envíos"
        description="Pagando por transferencia, el envío cuesta el valor por defecto (0 = GRATIS) salvo en las provincias con tarifa propia. En contra entrega el envío siempre es el adelanto configurado arriba."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Envío por defecto pagando por transferencia (USD, 0 = gratis)">
            <input
              type="number"
              min={0}
              step="0.01"
              value={settings.shipping.defaultRate}
              onChange={(e) => updateShipping('defaultRate', Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Tiempo de entrega (se muestra al cliente)">
            <input
              value={settings.shipping.deliveryTime}
              onChange={(e) => updateShipping('deliveryTime', e.target.value)}
              className={inputClass}
              placeholder="24 a 72 horas hábiles"
            />
          </Field>
          <Field label="Plazo para pedir cambio de talla (horas desde que recibe el pedido)">
            <input
              type="number"
              min={1}
              value={settings.exchangeWindowHours}
              onChange={(e) => update('exchangeWindowHours', Number(e.target.value) || 48)}
              className={inputClass}
            />
          </Field>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Provincias con tarifa propia (transferencia)</p>
          <ListEditor<ProvinceRate>
            items={settings.shipping.rates}
            onChange={(items) => updateShipping('rates', items)}
            empty={{ province: '', rate: 5 }}
            renderRow={(item, onEdit) => (
              <>
                <select
                  value={item.province}
                  onChange={(e) => onEdit({ ...item, province: e.target.value })}
                  className={`${inputClass} bg-white`}
                >
                  <option value="">Provincia...</option>
                  {PROVINCES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => onEdit({ ...item, rate: Number(e.target.value) })}
                  className={inputClass}
                  placeholder="Costo de envío"
                />
              </>
            )}
          />
        </div>
      </Section>

      <Section
        title="⭐ Marca estrella"
        description="Tu marca más vendida: aparece con bloque premium en el inicio, tarjeta en la portada, primera en el menú y en la cinta de marcas, con insignia dorada en sus productos y portada propia en el catálogo. El nombre debe coincidir con el campo Marca de los productos."
      >
        <label className="flex items-center gap-3 rounded-lg bg-cream-alt/60 p-3 text-sm font-semibold text-ink">
          <input
            type="checkbox"
            checked={settings.featuredBrand.enabled}
            onChange={(e) => updateFeatured('enabled', e.target.checked)}
          />
          Destacar una marca estrella
        </label>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Marca">
            <input value={settings.featuredBrand.name} onChange={(e) => updateFeatured('name', e.target.value)} className={inputClass} placeholder="On" />
          </Field>
          <Field label="Insignia">
            <input value={settings.featuredBrand.badge} onChange={(e) => updateFeatured('badge', e.target.value)} className={inputClass} placeholder="Más vendida" />
          </Field>
          <Field label="Texto del botón">
            <input value={settings.featuredBrand.buttonText} onChange={(e) => updateFeatured('buttonText', e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="Texto pequeño (arriba del título)">
          <input value={settings.featuredBrand.eyebrow} onChange={(e) => updateFeatured('eyebrow', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Título">
          <input value={settings.featuredBrand.heading} onChange={(e) => updateFeatured('heading', e.target.value)} className={inputClass} />
        </Field>
        <Field label="Descripción">
          <textarea value={settings.featuredBrand.text} onChange={(e) => updateFeatured('text', e.target.value)} rows={3} className={inputClass} />
        </Field>
        <Field label="Beneficios (uno por línea, ideal 4)">
          <textarea
            value={settings.featuredBrand.bullets.join('\n')}
            onChange={(e) => updateFeatured('bullets', e.target.value.split('\n'))}
            rows={4}
            className={inputClass}
          />
        </Field>
        <ImageUploadField
          label="Foto del zapato (mejor en PNG sin fondo, se muestra flotando)"
          value={settings.featuredBrand.image}
          folder="site"
          onChange={(url) => updateFeatured('image', url)}
        />
      </Section>

      <Section title="Marcas" description="Aparecen en el menú Marcas, en la cinta de marcas del inicio y como sugerencia al crear productos. Una por línea.">
        <textarea
          value={settings.brands.join('\n')}
          onChange={(e) => update('brands', e.target.value.split('\n'))}
          onBlur={(e) => update('brands', e.target.value.split('\n').map((b) => b.trim()).filter(Boolean))}
          rows={6}
          className={inputClass}
        />
      </Section>

      <Section
        title="Menú de estilos"
        description='Aparece como "Estilos" en el menú y como filtro del catálogo. El "Valor" debe coincidir exactamente con el campo "Estilo / colección" de cada producto.'
      >
        <ListEditor<CollectionMenuItem>
          items={settings.collectionsMenu}
          onChange={(items) => update('collectionsMenu', items)}
          empty={{ label: '', value: '' }}
          renderRow={(item, onEdit) => (
            <>
              <input
                value={item.label}
                onChange={(e) => onEdit({ ...item, label: e.target.value })}
                className={inputClass}
                placeholder="Nombre en el menú (ej: Running)"
              />
              <input
                value={item.value}
                onChange={(e) => onEdit({ ...item, value: e.target.value })}
                className={inputClass}
                placeholder="Valor (ej: running)"
              />
            </>
          )}
        />
        {settings.collectionsMenu.length === 0 && (
          <p className="text-xs text-muted">
            Todavía no has agregado colecciones al menú — el menú &ldquo;Estilos&rdquo; no se mostrará hasta
            que agregues al menos una.
          </p>
        )}
      </Section>

      <Section
        title="Colores de la marca"
        description="Se aplican en todo el sitio al instante"
        action={
          <button
            type="button"
            onClick={resetColors}
            className="shrink-0 whitespace-nowrap text-xs font-semibold text-muted hover:text-urgent"
          >
            ↺ Restablecer
          </button>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ColorField
            label="Primario (botones, CTA)"
            value={settings.colors.primary}
            onChange={(v) => updateNested('colors', 'primary', v)}
          />
          <ColorField
            label="Primario hover"
            value={settings.colors.primaryHover}
            onChange={(v) => updateNested('colors', 'primaryHover', v)}
          />
          <ColorField
            label="Acento claro"
            value={settings.colors.primaryLight}
            onChange={(v) => updateNested('colors', 'primaryLight', v)}
          />
          <ColorField
            label="Fondo principal"
            value={settings.colors.cream}
            onChange={(v) => updateNested('colors', 'cream', v)}
          />
          <ColorField
            label="Fondo alterno"
            value={settings.colors.creamAlt}
            onChange={(v) => updateNested('colors', 'creamAlt', v)}
          />
          <ColorField
            label="Texto principal"
            value={settings.colors.ink}
            onChange={(v) => updateNested('colors', 'ink', v)}
          />
          <ColorField
            label="Texto secundario"
            value={settings.colors.muted}
            onChange={(v) => updateNested('colors', 'muted', v)}
          />
          <ColorField
            label="Bordes"
            value={settings.colors.border}
            onChange={(v) => updateNested('colors', 'border', v)}
          />
        </div>
      </Section>

      <Section
        title="Tipografía"
        description="La letra de títulos y de textos en todo el sitio (títulos, subtítulos, descripciones, botones...). Elige de la lista o escribe cualquier fuente de Google Fonts manualmente."
        action={
          <button
            type="button"
            onClick={resetFonts}
            className="shrink-0 whitespace-nowrap text-xs font-semibold text-muted hover:text-urgent"
          >
            ↺ Restablecer
          </button>
        }
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <FontPicker
            label="Fuente de títulos"
            value={settings.fonts.headingFont}
            onChange={(v) => updateNested('fonts', 'headingFont', v)}
            previewFallback="serif"
          />
          <FontPicker
            label="Fuente de textos (párrafos, botones)"
            value={settings.fonts.bodyFont}
            onChange={(v) => updateNested('fonts', 'bodyFont', v)}
            previewFallback="sans-serif"
          />
        </div>
        <p className="text-xs text-muted">
          💡 Para un look moderno y juvenil (tipo Canva o CapCut) prueba combinaciones como{' '}
          <strong className="text-ink">Bebas Neue</strong> o <strong className="text-ink">Fredoka</strong> en
          títulos con <strong className="text-ink">Poppins</strong> o <strong className="text-ink">Nunito</strong>{' '}
          en textos. Para algo elegante, <strong className="text-ink">Playfair Display</strong> +{' '}
          <strong className="text-ink">Inter</strong>. La combinación por defecto de Brooklyn es{' '}
          <strong className="text-ink">Montserrat</strong> en todo (igual que el logo).
        </p>
      </Section>

      <Section title="Barra de anuncios" description="Los mensajes que rotan arriba de todo, uno por línea">
        <textarea
          value={settings.announcementMessages.join('\n')}
          onChange={(e) => update('announcementMessages', e.target.value.split('\n'))}
          rows={6}
          className={inputClass}
        />
      </Section>

      <Section title="Inicio — Hero principal">
        <Field label="Eyebrow (texto pequeño arriba del título)">
          <input
            value={settings.hero.eyebrow}
            onChange={(e) => updateNested('hero', 'eyebrow', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Título principal">
          <input
            value={settings.hero.heading}
            onChange={(e) => updateNested('hero', 'heading', e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tamaño del título">
            <select
              value={settings.hero.titleSize}
              onChange={(e) => updateNested('hero', 'titleSize', e.target.value as typeof settings.hero.titleSize)}
              className={`${inputClass} bg-white`}
            >
              <option value="sm">Pequeño</option>
              <option value="md">Normal</option>
              <option value="lg">Grande</option>
              <option value="xl">Extra grande</option>
            </select>
          </Field>
          <Field label="Tamaño del subtítulo">
            <select
              value={settings.hero.subtextSize}
              onChange={(e) =>
                updateNested('hero', 'subtextSize', e.target.value as typeof settings.hero.subtextSize)
              }
              className={`${inputClass} bg-white`}
            >
              <option value="sm">Pequeño</option>
              <option value="md">Normal</option>
              <option value="lg">Grande</option>
            </select>
          </Field>
        </div>
        <Field label="Subtítulo">
          <textarea
            value={settings.hero.subtext}
            onChange={(e) => updateNested('hero', 'subtext', e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>
        <MultiImageUploadField
          label="Fotos del hero (van rotando solas si subes varias)"
          help="La primera foto es la portada. Se recomienda máximo 4-5 fotos para que roten con buen ritmo."
          values={settings.hero.images}
          folder="site"
          onChange={(urls) => updateNested('hero', 'images', urls)}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Badge 1">
            <input
              value={settings.hero.badge1}
              onChange={(e) => updateNested('hero', 'badge1', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Badge 2">
            <input
              value={settings.hero.badge2}
              onChange={(e) => updateNested('hero', 'badge2', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Badge 3">
            <input
              value={settings.hero.badge3}
              onChange={(e) => updateNested('hero', 'badge3', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Botón 1 — texto">
            <input
              value={settings.hero.button1Text}
              onChange={(e) => updateNested('hero', 'button1Text', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Botón 1 — enlace">
            <input
              value={settings.hero.button1Url}
              onChange={(e) => updateNested('hero', 'button1Url', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Botón 2 — texto">
            <input
              value={settings.hero.button2Text}
              onChange={(e) => updateNested('hero', 'button2Text', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Botón 2 — enlace">
            <input
              value={settings.hero.button2Url}
              onChange={(e) => updateNested('hero', 'button2Url', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Barra de confianza" description="Los 5 iconos con texto que aparecen bajo el hero">
        <ListEditor<TrustItem>
          items={settings.trustItems}
          onChange={(items) => update('trustItems', items)}
          empty={{ icon: '⭐', title: '', sub: '' }}
          renderRow={(item, onEdit) => (
            <>
              <input
                value={item.icon}
                onChange={(e) => onEdit({ ...item, icon: e.target.value })}
                className={`${inputClass} w-16 text-center`}
                placeholder="🚚"
              />
              <input
                value={item.title}
                onChange={(e) => onEdit({ ...item, title: e.target.value })}
                className={inputClass}
                placeholder="Título"
              />
              <input
                value={item.sub}
                onChange={(e) => onEdit({ ...item, sub: e.target.value })}
                className={inputClass}
                placeholder="Subtítulo"
              />
            </>
          )}
        />
      </Section>

      <Section title="Sección de beneficios">
        <Field label="Título de la sección">
          <input
            value={settings.benefitsHeading}
            onChange={(e) => update('benefitsHeading', e.target.value)}
            className={inputClass}
          />
        </Field>
        <ListEditor<BenefitItem>
          items={settings.benefits}
          onChange={(items) => update('benefits', items)}
          empty={{ icon: '⭐', title: '', text: '' }}
          renderRow={(item, onEdit) => (
            <>
              <input
                value={item.icon}
                onChange={(e) => onEdit({ ...item, icon: e.target.value })}
                className={`${inputClass} w-16 text-center`}
                placeholder="⭐"
              />
              <input
                value={item.title}
                onChange={(e) => onEdit({ ...item, title: e.target.value })}
                className={inputClass}
                placeholder="Título"
              />
              <input
                value={item.text}
                onChange={(e) => onEdit({ ...item, text: e.target.value })}
                className={inputClass}
                placeholder="Descripción"
              />
            </>
          )}
        />
      </Section>

      <Section title="Testimonios">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título de la sección">
            <input
              value={settings.testimonialsHeading}
              onChange={(e) => update('testimonialsHeading', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Subtítulo">
            <input
              value={settings.testimonialsSubtext}
              onChange={(e) => update('testimonialsSubtext', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <ListEditor<TestimonialItem>
          items={settings.testimonials}
          onChange={(items) => update('testimonials', items)}
          empty={{ name: '', city: '', review: '' }}
          renderRow={(item, onEdit) => (
            <>
              <input
                value={item.name}
                onChange={(e) => onEdit({ ...item, name: e.target.value })}
                className={inputClass}
                placeholder="Nombre"
              />
              <input
                value={item.city}
                onChange={(e) => onEdit({ ...item, city: e.target.value })}
                className={inputClass}
                placeholder="Ciudad"
              />
              <input
                value={item.review}
                onChange={(e) => onEdit({ ...item, review: e.target.value })}
                className={inputClass}
                placeholder="Reseña"
              />
            </>
          )}
        />
      </Section>

      <Section title="Llamado a la acción final (antes del footer)">
        <Field label="Eyebrow">
          <input
            value={settings.cta.eyebrow}
            onChange={(e) => updateNested('cta', 'eyebrow', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Título">
          <input
            value={settings.cta.heading}
            onChange={(e) => updateNested('cta', 'heading', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Texto">
          <textarea
            value={settings.cta.text}
            onChange={(e) => updateNested('cta', 'text', e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Botón — texto">
            <input
              value={settings.cta.buttonText}
              onChange={(e) => updateNested('cta', 'buttonText', e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Botón — enlace">
            <input
              value={settings.cta.buttonUrl}
              onChange={(e) => updateNested('cta', 'buttonUrl', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Section>

      <Section title="Preguntas frecuentes" description="Se muestran en el inicio, antes del llamado final">
        <ListEditor<FaqItem>
          items={settings.faqs}
          onChange={(items) => update('faqs', items)}
          empty={{ question: '', answer: '' }}
          renderRow={(item, onEdit) => (
            <div className="grid w-full gap-2">
              <input
                value={item.question}
                onChange={(e) => onEdit({ ...item, question: e.target.value })}
                className={inputClass}
                placeholder="Pregunta"
              />
              <textarea
                value={item.answer}
                onChange={(e) => onEdit({ ...item, answer: e.target.value })}
                rows={3}
                className={inputClass}
                placeholder="Respuesta"
              />
            </div>
          )}
        />
      </Section>

      <Section title="Footer">
        <Field label="Descripción de la marca">
          <textarea
            value={settings.footer.brandText}
            onChange={(e) => updateNested('footer', 'brandText', e.target.value)}
            rows={2}
            className={inputClass}
          />
        </Field>
        <Field label="Texto de contacto">
          <input
            value={settings.footer.contactText}
            onChange={(e) => updateNested('footer', 'contactText', e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Correo de contacto (se muestra en el pie de página y en la confirmación del pedido)">
          <input
            type="email"
            value={settings.footer.email}
            onChange={(e) => updateNested('footer', 'email', e.target.value)}
            className={inputClass}
            placeholder="brooklynstore.ec@gmail.com"
          />
        </Field>
        <Field label="Ciudad / dirección (opcional)">
          <input
            value={settings.footer.address}
            onChange={(e) => updateNested('footer', 'address', e.target.value)}
            className={inputClass}
            placeholder="Ej: Quito, Ecuador"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Instagram (URL, opcional)">
            <input
              value={settings.footer.instagram}
              onChange={(e) => updateNested('footer', 'instagram', e.target.value)}
              className={inputClass}
              placeholder="https://instagram.com/..."
            />
          </Field>
          <Field label="Facebook (URL, opcional)">
            <input
              value={settings.footer.facebook}
              onChange={(e) => updateNested('footer', 'facebook', e.target.value)}
              className={inputClass}
              placeholder="https://facebook.com/..."
            />
          </Field>
          <Field label="TikTok (URL, opcional)">
            <input
              value={settings.footer.tiktok}
              onChange={(e) => updateNested('footer', 'tiktok', e.target.value)}
              className={inputClass}
              placeholder="https://tiktok.com/@..."
            />
          </Field>
        </div>
        <Field label="Texto de derechos de autor (vacío = automático)">
          <input
            value={settings.footer.copyrightText}
            onChange={(e) => updateNested('footer', 'copyrightText', e.target.value)}
            className={inputClass}
            placeholder={`© ${new Date().getFullYear()} ${settings.storeName}. Todos los derechos reservados.`}
          />
        </Field>
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-white/95 p-4 backdrop-blur sm:pl-56">
        <div className="mx-auto flex max-w-4xl items-center justify-end gap-4">
          {saved && <span className="text-sm font-semibold text-primary">✓ Guardado</span>}
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ListEditor<T>({
  items,
  onChange,
  empty,
  renderRow,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  renderRow: (item: T, onEdit: (item: T) => void) => React.ReactNode;
}) {
  function updateAt(index: number, item: T) {
    onChange(items.map((it, i) => (i === index ? item : it)));
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:flex sm:items-center">
            {renderRow(item, (updated) => updateAt(i, updated))}
          </div>
          <button
            type="button"
            onClick={() => removeAt(i)}
            className="shrink-0 self-end text-lg text-urgent sm:self-auto"
            aria-label="Eliminar"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, empty])}
        className="text-sm font-semibold text-primary hover:underline"
      >
        + Agregar
      </button>
    </div>
  );
}
