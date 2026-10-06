'use client';

import { useEffect, useMemo, useState } from 'react';
import SafeImage from '@/components/SafeImage';
import { getSiteSettings } from '@/lib/settings';
import { buildRecoveryMessage, markRecoverySent, subscribeVisitors } from '@/lib/visitorsAdmin';
import { classNames, formatPrice, whatsappLinkTo } from '@/lib/utils';
import type { SiteSettings, Visitor, VisitorStage } from '@/lib/types';

const ONLINE_MS = 5 * 60 * 1000;
const ABANDON_MS = 15 * 60 * 1000;

const STAGE: Record<VisitorStage, { label: string; cls: string }> = {
  visita: { label: 'Navegando', cls: 'bg-cream-alt text-muted' },
  producto: { label: 'Vio zapatos', cls: 'bg-sky-100 text-sky-800' },
  carrito: { label: 'En el carrito', cls: 'bg-primary/20 text-ink' },
  checkout: { label: 'En el pago', cls: 'bg-orange-100 text-orange-800' },
  compra: { label: '✓ Compró', cls: 'bg-whatsapp/15 text-whatsapp' },
};

const RANK: Record<VisitorStage, number> = { visita: 0, producto: 1, carrito: 2, checkout: 3, compra: 4 };

type Range = 'hoy' | '7d';
type Tab = 'vivo' | 'abandonados' | 'todos';

function ago(ms: number): string {
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return 'ahora';
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

function pageLabel(path: string): string {
  if (path === '/') return 'Inicio';
  if (path.startsWith('/producto/')) return `Zapato: ${decodeURIComponent(path.slice(10)).replace(/-/g, ' ')}`;
  if (path.startsWith('/catalogo')) return 'Catálogo';
  if (path.startsWith('/carrito')) return 'Carrito';
  if (path.startsWith('/checkout')) return 'Pago';
  if (path.startsWith('/pedido-confirmado')) return 'Pedido confirmado';
  if (path.startsWith('/coleccion')) return 'Colección';
  return path;
}

const isAbandoned = (v: Visitor) => v.cart.length > 0 && v.stage !== 'compra' && Date.now() - v.lastSeen > ABANDON_MS;

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[] | null>(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState<Range>('hoy');
  const [tab, setTab] = useState<Tab>('vivo');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    getSiteSettings().then(setSettings).catch(() => {});
    const unsub = subscribeVisitors(
      7,
      (list) => setVisitors(list),
      (e) => {
        setError(e.message.includes('permission') ? 'Falta publicar las reglas nuevas de Firestore (ver instrucciones).' : e.message);
        setVisitors([]);
      },
    );
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => {
      unsub();
      clearInterval(t);
    };
  }, []);

  const startOfDay = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const all = visitors ?? [];
  const inRange = range === 'hoy' ? all.filter((v) => v.lastSeen >= startOfDay) : all;
  const online = all.filter((v) => Date.now() - v.lastSeen < ONLINE_MS);
  const abandoned = all
    .filter(isAbandoned)
    .sort((a, b) => Number(!!b.phone) - Number(!!a.phone) || Number(!a.recoveryAt) - Number(!b.recoveryAt) || b.cartValue - a.cartValue);

  const reached = (stage: VisitorStage) => inRange.filter((v) => RANK[v.stage] >= RANK[stage] || (stage !== 'compra' && !!v.orderNumber)).length;
  const funnel: { stage: VisitorStage; label: string; count: number }[] = [
    { stage: 'visita', label: 'Visitantes', count: inRange.length },
    { stage: 'producto', label: 'Vieron un zapato', count: reached('producto') },
    { stage: 'carrito', label: 'Agregaron al carrito', count: reached('carrito') },
    { stage: 'checkout', label: 'Iniciaron el pago', count: reached('checkout') },
    { stage: 'compra', label: 'Compraron', count: inRange.filter((v) => v.stage === 'compra' || v.orderNumber).length },
  ];
  const conversion = inRange.length ? (funnel[4].count / inRange.length) * 100 : 0;
  const pendingValue = abandoned.reduce((s, v) => s + v.cartValue, 0);

  const sources = Object.entries(
    inRange.reduce<Record<string, { visits: number; carts: number; sales: number }>>((acc, v) => {
      const k = v.source || 'Directo';
      acc[k] ??= { visits: 0, carts: 0, sales: 0 };
      acc[k].visits += 1;
      if (RANK[v.stage] >= 2 || v.orderNumber) acc[k].carts += 1;
      if (v.stage === 'compra' || v.orderNumber) acc[k].sales += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1].visits - a[1].visits);

  const topProducts = Object.values(
    inRange.reduce<Record<string, { title: string; image: string; views: number }>>((acc, v) => {
      for (const p of v.products) {
        acc[p.slug] ??= { title: p.title, image: p.image, views: 0 };
        acc[p.slug].views += 1;
      }
      return acc;
    }, {}),
  )
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const list = tab === 'vivo' ? online : tab === 'abandonados' ? abandoned : inRange;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-ink">Visitantes</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-whatsapp opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-whatsapp" />
            </span>
            <strong className="text-ink">{online.length}</strong> en la tienda ahora · se actualiza solo
          </p>
        </div>
        <div className="flex rounded-full bg-white p-1 shadow-soft">
          {(['hoy', '7d'] as Range[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={classNames('rounded-full px-4 py-1.5 text-xs font-bold', range === r ? 'bg-ink text-white' : 'text-muted')}
            >
              {r === 'hoy' ? 'Hoy' : 'Últimos 7 días'}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-urgent/10 p-3 text-sm font-semibold text-urgent">{error}</p>}

      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Visitantes', value: inRange.length },
          { label: 'Llegaron al carrito', value: funnel[2].count },
          { label: 'Compraron', value: funnel[4].count },
          { label: 'Conversión', value: `${conversion.toFixed(1)}%` },
        ].map((k) => (
          <div key={k.label} className="rounded-card bg-white p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p>
            <p className="mt-2 text-3xl font-black text-ink">{visitors ? k.value : '—'}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* Embudo */}
        <div className="rounded-card bg-white p-5 shadow-soft lg:col-span-2">
          <p className="text-sm font-black uppercase text-ink">Embudo de compra</p>
          <div className="mt-4 space-y-3">
            {funnel.map((f, i) => {
              const pct = inRange.length ? (f.count / inRange.length) * 100 : 0;
              return (
                <div key={f.stage}>
                  <div className="flex justify-between text-xs font-bold text-ink">
                    <span>
                      {i + 1}. {f.label}
                    </span>
                    <span>
                      {f.count} <span className="font-semibold text-muted">· {pct.toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-cream-alt">
                    <div
                      className={classNames('h-full rounded-full transition-all', f.stage === 'compra' ? 'bg-whatsapp' : 'bg-gold-gradient')}
                      style={{ width: `${Math.max(pct, f.count ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Orígenes */}
        <div className="rounded-card bg-white p-5 shadow-soft">
          <p className="text-sm font-black uppercase text-ink">¿De dónde llegan?</p>
          <div className="mt-4 space-y-2.5">
            {sources.length === 0 && <p className="text-sm text-muted">Aún sin visitas en este periodo.</p>}
            {sources.slice(0, 7).map(([name, s]) => (
              <div key={name} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-bold text-ink">{name}</span>
                <span className="shrink-0 text-xs text-muted">
                  <strong className="text-ink">{s.visits}</strong> visitas · {s.carts} carrito · <strong className="text-whatsapp">{s.sales}</strong> ventas
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="mt-4 rounded-card bg-white p-5 shadow-soft">
          <p className="text-sm font-black uppercase text-ink">Zapatos más vistos</p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {topProducts.map((p) => (
              <div key={p.title} className="text-center">
                <span className="relative mx-auto block aspect-square w-full overflow-hidden rounded-xl bg-cream-alt">
                  {p.image && <SafeImage src={p.image} alt={p.title} fill sizes="140px" className="object-cover" />}
                </span>
                <p className="mt-1 truncate text-xs font-bold text-ink">{p.title}</p>
                <p className="text-[11px] text-muted">{p.views} personas</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Listas */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ['vivo', `● En la tienda ahora (${online.length})`],
            ['abandonados', `🛒 Carritos abandonados (${abandoned.length})`],
            ['todos', `Todos (${inRange.length})`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={classNames('rounded-full px-4 py-2 text-sm font-bold', tab === key ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-border')}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'abandonados' && abandoned.length > 0 && (
        <p className="mt-3 rounded-xl bg-gold-50 px-4 py-3 text-sm text-ink ring-1 ring-primary/30">
          <strong>{formatPrice(pendingValue)}</strong> en carritos sin terminar. Los que dejaron su celular aparecen primero: envíales el mensaje
          y les llega un link que <strong>arma su carrito automáticamente</strong>. Los que no lo dejaron verán tu anuncio otra vez gracias al
          Píxel de Meta.
        </p>
      )}

      <div className="mt-3 space-y-3">
        {visitors === null && <p className="text-sm text-muted">Cargando...</p>}
        {visitors && list.length === 0 && (
          <p className="rounded-card bg-white p-6 text-center text-sm text-muted shadow-soft">
            {tab === 'vivo' ? 'Nadie navegando en este momento.' : tab === 'abandonados' ? '¡Ningún carrito abandonado! 🙌' : 'Sin visitas en este periodo.'}
          </p>
        )}
        {list.slice(0, 150).map((v) => (
          <VisitorCard key={v.id} v={v} settings={settings} />
        ))}
      </div>
    </div>
  );
}

function VisitorCard({ v, settings }: { v: Visitor; settings: SiteSettings | null }) {
  const [sent, setSent] = useState(!!v.recoveryAt);
  const live = Date.now() - v.lastSeen < ONLINE_MS;
  const abandoned = isAbandoned(v);
  const message =
    settings && v.phone
      ? buildRecoveryMessage(v, {
          codAdvance: settings.payments.codAdvance,
          deliveryTime: settings.shipping.deliveryTime,
          exchangeHours: settings.exchangeWindowHours,
        })
      : '';

  return (
    <div className={classNames('rounded-card bg-white p-4 shadow-soft sm:p-5', abandoned && v.phone && !sent && 'ring-2 ring-primary/50')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-black text-white">
            {(v.name || 'V').charAt(0).toUpperCase()}
            {live && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-whatsapp ring-2 ring-white" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-bold text-ink">
              {v.name || `Visitante ${v.id.slice(0, 5).toUpperCase()}`}
              {v.phone && <span className="ml-2 text-xs font-semibold text-muted">{v.phone}</span>}
            </span>
            <span className="block truncate text-xs text-muted">
              {[v.city && `${v.city}${v.region ? `, ${v.region}` : ''}`, v.device, v.source, v.visits > 1 && `${v.visits}ª visita`]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className={classNames('rounded-full px-3 py-1', STAGE[v.stage].cls)}>{STAGE[v.stage].label}</span>
          <span className="text-muted">{live ? '● En línea' : ago(v.lastSeen)}</span>
        </div>
      </div>

      <p className="mt-2 text-xs text-muted">
        {v.pageviews} {v.pageviews === 1 ? 'página' : 'páginas'} · ahora en <strong className="text-ink">{pageLabel(v.lastPath)}</strong>
        {v.campaign && <> · anuncio: {v.campaign}</>}
        {v.orderNumber && <> · pedido {v.orderNumber}</>}
      </p>

      {(v.cart.length > 0 || v.products.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(v.cart.length ? v.cart : v.products).slice(0, 5).map((p, i) => (
            <span key={i} className="relative h-12 w-12 overflow-hidden rounded-lg bg-cream-alt" title={p.title}>
              {p.image && <SafeImage src={p.image} alt={p.title} fill sizes="48px" className="object-cover" />}
            </span>
          ))}
          <span className="text-xs text-muted">
            {v.cart.length ? (
              <>
                Carrito: <strong className="text-ink">{formatPrice(v.cartValue)}</strong> · {v.cart.map((c) => `${c.title} T${c.size}`).join(', ')}
              </>
            ) : (
              <>Vio: {v.products.map((p) => p.title).join(', ')}</>
            )}
          </span>
        </div>
      )}

      {abandoned && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {v.phone ? (
            <a
              href={whatsappLinkTo(v.phone, message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setSent(true);
                markRecoverySent(v.id).catch(() => {});
              }}
              className="rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.03]"
            >
              {sent ? '↻ Escribirle otra vez' : '💬 Recuperar por WhatsApp'}
            </a>
          ) : (
            <span className="rounded-lg bg-cream-alt px-3 py-2 text-xs font-semibold text-muted">
              No dejó su celular · Meta le volverá a mostrar tu anuncio
            </span>
          )}
          {sent && v.recoveryAt && <span className="text-xs text-muted">Mensaje enviado {ago(v.recoveryAt)}</span>}
        </div>
      )}
    </div>
  );
}
