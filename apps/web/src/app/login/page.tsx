'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLogin } from '@/hooks/use-auth';
import { getSafeReturnUrl } from '@/lib/auth-url';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = getSafeReturnUrl(searchParams.get('returnUrl'));
  const { mutate: doLogin, isPending, error } = useLogin();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(
      { email: identifier, password },
      { onSuccess: () => router.push(returnUrl) },
    );
  };

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="rounded-2xl bg-muted p-8">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Entrar</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Não tem conta?{' '}
          <Link href="/register" className="text-purple-400 hover:underline">
            Cadastrar-se
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Email ou username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              className="input-base"
              placeholder="seu@email.com ou username"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-sm text-muted-foreground">Senha</label>
              <Link href="/esqueci-senha" className="text-xs text-purple-400 hover:underline">
                Esqueci a senha
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="input-base"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error.message}
            </p>
          )}

          <button type="submit" disabled={isPending} className="btn-primary mt-2 w-full py-2.5">
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto mt-10 max-w-sm animate-pulse rounded-2xl bg-muted p-8 h-80" />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
