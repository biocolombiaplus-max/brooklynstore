import { FIREBASE_CONFIG } from './firebase-config';

// Valida en el servidor que la petición viene de un administrador: token de
// Firebase válido y usuario presente en la colección "admins".
export async function isAdminRequest(request: Request): Promise<boolean> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return false;
  try {
    const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_CONFIG.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    });
    if (!lookup.ok) return false;
    const uid = ((await lookup.json()) as { users?: { localId: string }[] }).users?.[0]?.localId;
    if (!uid) return false;
    const adminDoc = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/admins/${uid}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    );
    return adminDoc.ok;
  } catch {
    return false;
  }
}
