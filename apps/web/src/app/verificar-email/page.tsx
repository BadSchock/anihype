'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

type Status = 'loading' | 'success' | 'error';

function VerifyEmailContent() {
  const token = useSearchParams().get('token') ?? '';
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(token ? '' : 'Abra o link completo que enviamos por e-mail.');
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        const { user, setAuth, accessToken, refreshToken } = useAuthStore.getState();
        if (user && accessToken && refreshToken) {
          setAuth({ ...user, emailVerified: true }, accessToken, refreshToken);
        } else if (user) {
          useAuthStore.setState({ user: { ...user, emailVerified: true } });
        }
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Não foi possível confirmar o e-mail.');
      });
  }, [token]);

  return (
    <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-muted p-8">
      {status === 'loading' && (
        <>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Confirmando...</h1>
          <p className="text-sm text-muted-foreground">Só um instante.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <h1 className="mb-2 text-2xl font-bold text-foreground">E-mail confirmado</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Pronto! Sua conta está protegida e você poderá recuperar a senha por este e-mail.
          </p>
          <Link href="/" className="btn-primary block w-full py-2.5 text-center">
            Ir para o início
          </Link>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="mb-2 text-2xl font-bold text-foreground">Não foi possível confirmar</h1>
          <p className="mb-6 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{message}</p>
          <p className="text-sm text-muted-foreground">
            Entre na sua conta e peça um novo link em{' '}
            <Link href="/perfil/editar" className="text-purple-400 hover:underline">
              Editar perfil
            </Link>
            .
          </p>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto mt-10 h-48 max-w-sm animate-pulse rounded-2xl bg-muted" />}
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
