'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/services/api';

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) return setError('A senha deve ter no mínimo 8 caracteres');
    if (password.length > 128) return setError('A senha deve ter no máximo 128 caracteres');
    if (password !== confirm) return setError('As senhas não coincidem');

    setPending(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      window.setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível atualizar a senha.');
    } finally {
      setPending(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-muted p-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground">Link incompleto</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Abra o link completo que enviamos por e-mail, ou peça um novo.
        </p>
        <Link href="/esqueci-senha" className="btn-primary block w-full py-2.5 text-center">
          Pedir novo link
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="rounded-2xl bg-muted p-8">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Nova senha</h1>

        {done ? (
          <p className="mt-4 rounded-lg bg-green-500/10 px-3 py-3 text-sm text-green-400">
            Senha atualizada. Levando você para o login...
          </p>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">Escolha uma senha nova para sua conta.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Nova senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="input-base"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">Repita a senha</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="input-base"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
                  {error}{' '}
                  {error.includes('inválido') && (
                    <Link href="/esqueci-senha" className="underline">
                      Pedir novo link
                    </Link>
                  )}
                </p>
              )}

              <button type="submit" disabled={pending} className="btn-primary mt-2 w-full py-2.5">
                {pending ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="mx-auto mt-10 h-80 max-w-sm animate-pulse rounded-2xl bg-muted" />}
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
