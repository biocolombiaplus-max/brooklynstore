// Service worker de notificaciones push — recibe el aviso de pedido nuevo
// del servidor y lo muestra como notificación del sistema, funcione o no
// la tienda abierta en ese momento (igual que la app de Shopify).

self.addEventListener('push', (event) => {
  let data = { title: '🎉 Nuevo pedido', body: 'Entra a ver el detalle.', url: '/admin/pedidos' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // si el payload no es JSON, se usan los valores por defecto
  }

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon-192',
        badge: '/icon-192',
        data: { url: data.url },
        // Patrón de vibración más largo e intenso que antes — pulsos más
        // fuertes y una repetición extra, para que se note bien aunque el
        // celular esté en la mesa o en el bolsillo.
        vibrate: [600, 150, 600, 150, 600, 150, 600, 150, 800],
        requireInteraction: true,
        silent: false,
        // Sin esta combinación, si llegan dos pedidos seguidos, la segunda
        // notificación con la misma "tag" reemplazaba a la primera SIN volver
        // a sonar ni vibrar (comportamiento por defecto del navegador) — con
        // "renotify" cada pedido nuevo vuelve a alertar de verdad.
        tag: `pedido-${Date.now()}`,
        renotify: true,
        actions: [{ action: 'view', title: '👀 Ver pedido' }],
      });

      // Insignia numérica sobre el ícono de la app instalada (Android Chrome
      // e iOS 16.4+ como PWA) — cuenta las notificaciones de pedido que
      // siguen sin verse, para que la administradora note de un vistazo,
      // sin abrir la app, cuántos pedidos nuevos le llegaron.
      try {
        if (self.navigator && 'setAppBadge' in self.navigator) {
          const notifications = await self.registration.getNotifications();
          await self.navigator.setAppBadge(notifications.length);
        }
      } catch {
        // Badging API no soportada en este navegador/dispositivo — se ignora.
      }
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin/pedidos';

  event.waitUntil(
    (async () => {
      try {
        if (self.navigator && 'clearAppBadge' in self.navigator) await self.navigator.clearAppBadge();
      } catch {
        // Badging API no soportada — se ignora.
      }

      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientsList) {
        if (client.url.includes(targetUrl) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })(),
  );
});
