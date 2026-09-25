'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from 'firebase/auth';
import { watchAuthState, isAdminUser, logoutAdmin } from '@/lib/auth';
import { AdminContext } from '@/lib/admin-context';

type Status = 'checking' | 'authorized' | 'unauthorized';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>('checking');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      if (!firebaseUser) {
        setStatus('unauthorized');
        router.replace('/admin/login');
        return;
      }
      const admin = await isAdminUser(firebaseUser.uid);
      if (!admin) {
        await logoutAdmin();
        setStatus('unauthorized');
        router.replace('/admin/login?error=no-autorizado');
        return;
      }
      setUser(firebaseUser);
      setStatus('authorized');
    });
    return () => unsubscribe();
  }, [router]);

  if (status !== 'authorized') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-muted">Verificando acceso...</p>
      </div>
    );
  }

  return <AdminContext.Provider value={user}>{children}</AdminContext.Provider>;
}
