'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAdmin } from '@/lib/auth';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    searchParams.get('error') === 'no-autorizado'
      ? 'Esta cuenta no tiene permisos de administrador.'
      : '',
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginAdmin(email, password);
      router.push('/admin');
    } catch {
      setError('Correo o contraseña incorrectos.');
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-card bg-white p-8 shadow-soft">
        <h1 className="mb-1 font-heading text-2xl font-bold text-ink">Panel administrativo</h1>
        <p className="mb-6 text-sm text-muted">Inicia sesión para gestionar tu tienda</p>

        <label className="mb-1 block text-sm font-semibold text-ink">Correo</label>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
        />

        <label className="mb-1 block text-sm font-semibold text-ink">Contraseña</label>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-lg border border-border px-4 py-2.5 focus:border-primary focus:outline-none"
        />

        {error && <p className="mb-4 text-sm text-urgent">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
