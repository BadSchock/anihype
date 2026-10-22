'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar agora. Tente de novo.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="rounded-2xl bg-muted p-8">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Esqueci a senha</h1>

        {sent ? (
          <div className="mt-4 flex flex-col gap-4">
            <p className="rounded-lg bg-green-500/10 px-3 py-3 text-sm text-green-400">
              Se esse e-mail estiver cadastrado, enviamos um link para criar uma nova senha. O link vale
              por 1 hora. Confira também a caixa de spam.
            </p>
            <Link href="/login" className="btn-primary w-full py-2.5 text-center">
              Voltar para o login
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              Digite o e-mail da sua conta e enviaremos um link para criar uma nova senha.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm text-muted-foreground">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="input-base"
                  placeholder="seu@email.com"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
              )}

              <button type="submit" disabled={pending} className="btn-primary mt-2 w-full py-2.5">
                {pending ? 'Enviando...' : 'Enviar link'}
              </button>
              <Link href="/login" className="text-center text-sm text-purple-400 hover:underline">
                Voltar para o login
              </Link>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
