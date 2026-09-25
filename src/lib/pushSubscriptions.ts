import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'pushSubscriptions';

// El "endpoint" de una suscripción push es único por dispositivo/navegador
// — se usa como ID del documento para que activar el mismo celular dos
// veces actualice el mismo registro en vez de duplicarlo.
function subscriptionId(endpoint: string): string {
  return btoa(endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-120);
}

export async function savePushSubscription(subscription: PushSubscriptionJSON): Promise<void> {
  if (!subscription.endpoint) return;
  await setDoc(doc(db, COLLECTION, subscriptionId(subscription.endpoint)), {
    ...subscription,
    savedAt: Date.now(),
  });
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, subscriptionId(endpoint)));
}

export async function getAllPushSubscriptions(): Promise<PushSubscriptionJSON[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => d.data() as PushSubscriptionJSON);
}
