'use client';

import { signInWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const CONFIG_ERROR = new Error(
  'Firebase no está configurado todavía. Agrega las variables NEXT_PUBLIC_FIREBASE_* (ver README.md).',
);

export function loginAdmin(email: string, password: string) {
  if (!auth) return Promise.reject(CONFIG_ERROR);
  return signInWithEmailAndPassword(auth, email, password);
}

export function logoutAdmin() {
  if (!auth) return Promise.resolve();
  return signOut(auth);
}

export function watchAuthState(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function isAdminUser(uid: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, 'admins', uid));
  return snap.exists();
}
