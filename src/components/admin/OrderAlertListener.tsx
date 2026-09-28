'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeToNewOrders } from '@/lib/orders';
import { playCashRegisterSound, unlockAudio } from '@/lib/cashRegisterSound';
import { getActivePushSubscription, isPushSupported, subscribeToPushNotifications } from '@/lib/push';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/lib/types';

const SOUND_STORAGE_KEY = 'brooklyn-admin-sound-enabled';

// Activo en todo el panel admin (no solo en Pedidos): apenas entra un
// pedido nuevo, suena la campanita (si el navegador sigue abierto) y llega
// una notificación push al celular (funcione o no la tienda abierta —
// igual que la app de Shopify). La suscripción push la recuerda el propio
// navegador, así que una vez activada queda para siempre, sin tener que
// repetir el paso cada vez que la administradora vuelve a entrar.
export default function OrderAlertListener() {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushChecked, setPushChecked] = useState(false);
  const [activating, setActivating] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [toastOrder, setToastOrder] = useState<Order | null>(null);
  const soundEnabledRef = useRef(false);
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (localStorage.getItem(SOUND_STORAGE_KEY) === '1') {
      unlockAudio().then((ok) => setSoundEnabled(ok));
    }
    getActivePushSubscription().then((sub) => {
      setPushEnabled(!!sub);
      setPushChecked(true);
    });
    // La administradora ya está viendo el panel — se apaga la insignia del
    // ícono de la app, si el navegador la soporta.
    if ('clearAppBadge' in navigator) {
      (navigator as Navigator & { clearAppBadge: () => Promise<void> }).clearAppBadge().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToNewOrders((order) => {
      setToastOrder(order);
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
      toastTimeout.current = setTimeout(() => setToastOrder(null), 10000);
      if (soundEnabledRef.current) playCashRegisterSound();
    });
    return () => {
      unsubscribe();
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  async function handleActivate() {
    setActivating(true);
    try {
      const audioOk = await unlockAudio();
      if (audioOk) {
        setSoundEnabled(true);
        localStorage.setItem(SOUND_STORAGE_KEY, '1');
        playCashRegisterSound();
      }
      if (isPushSupported()) {
        const result = await subscribeToPushNotifications();
        setPushEnabled(result === 'granted');
      }
    } finally {
      setActivating(false);
    }
  }

  // Botón de diagnóstico: manda un push real ahora mismo y explica en
  // pantalla exactamente por qué no llegó, en vez de dejar a la
  // administradora adivinando (¿faltan las llaves VAPID?, ¿nadie se
  // suscribió?, ¿la suscripción venció?) — así no hace falta simular un
  // pedido completo solo para confirmar que las notificaciones funcionan.
  async function handleTestNotification() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '🔔 Notificación de prueba',
          bodyText: 'Si ves y escuchas esto, las notificaciones están funcionando perfecto.',
          url: '/admin/pedidos',
        }),
      });
      const data = await res.json();
      if (data.skipped) setTestResult(`⚠️ ${data.reason}. Revisa las variables VAPID en Vercel y vuelve a desplegar.`);
      else if (data.error) setTestResult(`❌ Error del servidor: ${data.error}`);
      else if (data.total === 0)
        setTestResult('⚠️ Ningún dispositivo está suscrito todavía. Toca primero "Activar notificaciones de pedidos".');
      else if (data.sent === 0)
        setTestResult(
          `⚠️ Había ${data.total} dispositivo(s) registrado(s) pero ninguno recibió el envío${
            data.errorDetail ? ` (${data.errorDetail})` : ''
          } — desactiva y vuelve a activar las notificaciones en ese celular.`,
        );
      else setTestResult(`✅ Enviada a ${data.sent} de ${data.total} dispositivo(s). Revisa tu celular.`);
    } catch {
      setTestResult('❌ No se pudo contactar el servidor.');
    } finally {
      setTesting(false);
    }
  }

  const fullyActive = soundEnabled && (pushEnabled || !isPushSupported());
  // Antes de saber si ya hay una suscripción push guardada, no mostramos
  // nada para no parpadear el botón de "activar" un instante de más.
  if (!pushChecked) return null;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        {!fullyActive ? (
          <button
            type="button"
            onClick={handleActivate}
            disabled={activating}
            title="Activa el sonido y las notificaciones push de pedidos nuevos (solo se hace una vez)"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-urgent px-4 py-2.5 text-sm font-bold text-white shadow-soft transition-transform hover:scale-[1.01] disabled:opacity-70 sm:w-auto sm:rounded-full"
          >
            {activating ? 'Activando...' : '🔔 Activar notificaciones de pedidos'}
          </button>
        ) : (
          <span
            title="Sonido y notificaciones push activos en este dispositivo"
            className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1.5 text-xs font-bold text-primary-hover ring-1 ring-primary/30"
          >
            <span className="h-2 w-2 rounded-full bg-whatsapp" /> Notificaciones activas
          </span>
        )}
        <button
          type="button"
          onClick={handleTestNotification}
          disabled={testing}
          className="rounded-full border border-border bg-white px-3 py-1.5 text-xs font-bold text-ink shadow-soft transition-colors hover:border-primary disabled:opacity-60"
        >
          {testing ? 'Enviando...' : 'Probar notificación'}
        </button>
        {testResult && (
          <p className="w-full rounded-xl bg-white p-3 text-xs font-semibold text-ink shadow-soft ring-1 ring-border sm:text-right">
            {testResult}
            <button type="button" onClick={() => setTestResult(null)} className="ml-2 text-muted hover:text-ink" aria-label="Cerrar">
              ✕
            </button>
          </p>
        )}
      </div>

      {toastOrder && (
        <div className="fixed right-4 top-4 z-50 w-80 max-w-[calc(100vw-2rem)] animate-popIn rounded-card border-2 border-primary bg-white p-4 shadow-lift">
          <p className="text-sm font-bold text-ink">🛎️ ¡Nuevo pedido recibido!</p>
          <p className="mt-1 text-sm text-ink">
            {toastOrder.orderNumber} · <span className="font-bold text-primary">{formatPrice(toastOrder.total)}</span>
          </p>
          <p className="mt-0.5 text-xs text-muted">{toastOrder.customer.name} · {toastOrder.customer.city}</p>
          <button
            type="button"
            onClick={() => setToastOrder(null)}
            className="absolute right-2 top-2 text-xs text-muted hover:text-ink"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
