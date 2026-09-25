import { savePushSubscription, removePushSubscription } from './pushSubscriptions';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    !!VAPID_PUBLIC_KEY
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Revisa si este navegador YA tiene una suscripción activa — así el botón
// de activar notificaciones se queda "encendido" solo, sin que la
// administradora tenga que volver a activarlo cada vez que entra.
export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.getRegistration('/sw.js');
    if (!registration) return null;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

// Pide permiso (si hace falta), registra el service worker y suscribe este
// dispositivo — queda guardado por el navegador y en Firestore, así que la
// próxima vez que la administradora entre no tiene que repetir nada.
export async function subscribeToPushNotifications(): Promise<'granted' | 'denied' | 'unsupported' | 'error'> {
  if (!isPushSupported()) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }

    await savePushSubscription(subscription.toJSON() as PushSubscriptionJSON);
    return 'granted';
  } catch {
    return 'error';
  }
}

export async function unsubscribeFromPushNotifications(): Promise<void> {
  const subscription = await getActivePushSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await removePushSubscription(endpoint);
}
