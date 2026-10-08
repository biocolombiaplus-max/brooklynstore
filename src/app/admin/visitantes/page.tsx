'use client';

import { useEffect, useMemo, useState } from 'react';
import SafeImage from '@/components/SafeImage';
import { getSiteSettings } from '@/lib/settings';
import { buildRecoveryStepMessage, markRecoverySent, RECOVERY_STEPS, recoveryStatus, subscribeVisitors } from '@/lib/visitorsAdmin';
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

// Abandonó: tenía zapatos en el carrito (o dejó su celular en el pago) y se
// fue sin comprar hace más de 15 minutos.
const isAbandoned = (v: Visitor) =>
  (v.cart.length > 0 || (!!v.phone && RANK[v.stage] >= RANK.carrito)) && v.stage !== 'compra' && Date.now() - v.lastSeen > ABANDON_MS;
// Tiene zapatos en el carrito o está pagando AHORA (aún no cuenta como abandonado).
const inProgress = (v: Visitor) =>
  (v.cart.length > 0 || RANK[v.stage] >= RANK.carrito) && v.stage !== 'compra' && Date.now() - v.lastSeen <= ABANDON_MS;

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
  // Orden de trabajo: primero los que ya toca escribir, luego los próximos,
  // luego secuencias terminadas y al final quienes no dejaron celular.
  const priority = (v: Visitor) => {
    if (!v.phone) return 4;
    const st = recoveryStatus(v);
    if (st.due) return 0;
    if (st.next && !st.expired) return 1;
    return 3;
  };
  const abandoned = all
    .filter(isAbandoned)
    .sort((a, b) => priority(a) - priority(b) || recoveryStatus(a).dueAt - recoveryStatus(b).dueAt || b.cartValue - a.cartValue);
  const dueQueue = abandoned.filter((v) => v.phone && recoveryStatus(v).due);
  const live = all.filter(inProgress);

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
            ['abandonados', `🛒 Carritos abandonados (${abandoned.length})${dueQueue.length ? ` · ${dueQueue.length} por escribir` : ''}`],
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

      {tab === 'abandonados' && live.length > 0 && (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-whatsapp/10 px-4 py-3 text-sm font-semibold text-ink ring-1 ring-whatsapp/30">
          <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-whatsapp" />
          {live.length === 1 ? '1 persona tiene' : `${live.length} personas tienen`} zapatos en el carrito o está pagando ahora mismo. Si se va sin
          comprar, aparecerá aquí a los 15 minutos para que le escribas.
        </p>
      )}
      {tab === 'abandonados' && abandoned.length > 0 && (
        <RecoveryQueue queue={dueQueue} settings={settings} pendingValue={pendingValue} />
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

function stepMessage(v: Visitor, step: 1 | 2 | 3, settings: SiteSettings) {
  return buildRecoveryStepMessage(v, step, {
    codAdvance: settings.payments.codAdvance,
    deliveryTime: settings.shipping.deliveryTime,
    exchangeHours: settings.exchangeWindowHours,
    storeName: settings.storeName,
  });
}

function inTime(ms: number): string {
  const m = Math.max(1, Math.round((ms - Date.now()) / 60000));
  if (m < 60) return `en ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `en ${h} h` : `en ${Math.round(h / 24)} d`;
}

// Cola del día: uno tras otro, con un toque cada uno.
function RecoveryQueue({ queue, settings, pendingValue }: { queue: Visitor[]; settings: SiteSettings | null; pendingValue: number }) {
  const next = queue[0];
  const st = next ? recoveryStatus(next) : null;
  return (
    <div className="mt-3 overflow-hidden rounded-card bg-[#0a0a0a] text-white shadow-soft ring-1 ring-primary/40">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary-light">Seguimiento de carritos</p>
          <p className="mt-1 text-lg font-black">
            {queue.length ? `${queue.length} ${queue.length === 1 ? 'mensaje listo' : 'mensajes listos'} para enviar` : 'Al día ✓ Nada por enviar ahora'}
          </p>
          <p className="text-xs text-white/55">{formatPrice(pendingValue)} en carritos sin terminar</p>
        </div>
        {next && st?.next && settings && (
          <a
            href={whatsappLinkTo(next.phone, stepMessage(next, st.next.step, settings))}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => markRecoverySent(next.id).catch(() => {})}
            className="rounded-xl bg-whatsapp px-5 py-3 text-sm font-black text-white shadow-soft transition-transform hover:scale-[1.03]"
          >
            💬 Enviar siguiente · {next.name.split(' ')[0] || 'cliente'} (mensaje {st.next.step})
          </a>
        )}
      </div>
      <div className="grid grid-cols-3 border-t border-white/10 text-center text-[11px]">
        {RECOVERY_STEPS.map((s) => (
          <div key={s.step} className="border-r border-white/10 px-2 py-2.5 last:border-r-0">
            <p className="font-extrabold text-primary-light">
              {s.step}. {s.when}
            </p>
            <p className="text-white/60">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function VisitorCard({ v, settings }: { v: Visitor; settings: SiteSettings | null }) {
  const [preview, setPreview] = useState(false);
  const live = Date.now() - v.lastSeen < ONLINE_MS;
  const abandoned = isAbandoned(v);
  const st = recoveryStatus(v);
  const message = settings && v.phone && st.next ? stepMessage(v, st.next.step, settings) : '';

  return (
    <div className={classNames('rounded-card bg-white p-4 shadow-soft sm:p-5', abandoned && v.phone && st.due && 'ring-2 ring-whatsapp/60')}>
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
        <div className="mt-3 rounded-xl bg-cream-alt/60 p-3">
          {/* Línea de tiempo de los 3 mensajes */}
          <div className="flex items-center gap-1.5">
            {RECOVERY_STEPS.map((s) => {
              const done = st.sent >= s.step;
              const isNext = st.next?.step === s.step;
              return (
                <div key={s.step} className="flex flex-1 items-center gap-1.5">
                  <span
                    className={classNames(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black',
                      done ? 'bg-whatsapp text-white' : isNext && st.due ? 'bg-gold-gradient text-ink' : 'bg-white text-muted ring-1 ring-border',
                    )}
                  >
                    {done ? '✓' : s.step}
                  </span>
                  <span className="hidden truncate text-[10px] font-bold text-muted sm:block">{s.label}</span>
                  {s.step < 3 && <span className="h-px flex-1 bg-border" />}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {!v.phone ? (
              <span className="text-xs font-semibold text-muted">No dejó su celular · Meta le volverá a mostrar tu anuncio</span>
            ) : !st.next ? (
              <span className="text-xs font-semibold text-muted">✓ Secuencia completa (3 mensajes enviados)</span>
            ) : st.expired ? (
              <span className="text-xs font-semibold text-muted">Pasaron más de 7 días: mejor no insistir</span>
            ) : (
              <>
                <a
                  href={message ? whatsappLinkTo(v.phone, message) : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => markRecoverySent(v.id).catch(() => {})}
                  className={classNames(
                    'rounded-lg px-4 py-2.5 text-sm font-bold shadow-soft transition-transform hover:scale-[1.03]',
                    st.due ? 'bg-whatsapp text-white' : 'bg-white text-ink ring-1 ring-border',
                  )}
                >
                  💬 {st.due ? `Enviar mensaje ${st.next.step}` : `Adelantar mensaje ${st.next.step}`} · {st.next.label}
                </a>
                <span className="text-xs text-muted">{st.due ? 'Toca ahora ✓' : `Toca ${inTime(st.dueAt)}`}</span>
                <button type="button" onClick={() => setPreview((p) => !p)} className="text-xs font-bold text-muted underline underline-offset-4">
                  {preview ? 'Ocultar mensaje' : 'Ver mensaje'}
                </button>
              </>
            )}
            {v.recoveryAt && <span className="text-xs text-muted">· último enviado {ago(v.recoveryAt)}</span>}
          </div>
          {preview && message && (
            <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-white p-3 font-body text-xs text-ink ring-1 ring-border">{message}</pre>
          )}
        </div>
      )}
    </div>
  );
}
