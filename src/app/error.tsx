'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        padding: '2rem',
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
        background: '#FFFFFF',
        color: '#0E0E0E',
      }}
    >
      <p style={{ fontSize: '3rem' }}>😕</p>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Algo salió mal</h1>
      <p style={{ maxWidth: 420, color: '#8A7660', fontSize: '0.95rem' }}>
        Tuvimos un problema mostrando esta página. Intenta de nuevo en un momento.
      </p>
      <button
        onClick={reset}
        style={{
          background: '#B8923A',
          color: '#fff',
          border: 'none',
          borderRadius: '14px',
          padding: '0.75rem 1.5rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Reintentar
      </button>
    </div>
  );
}
