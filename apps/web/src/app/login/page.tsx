'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/use-auth';

export default function LoginPage() {
  const router = useRouter();
  const { mutate: doLogin, isPending, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(
      { email, password },
      { onSuccess: () => router.push('/') },
    );
  };

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="rounded-2xl bg-white/5 p-8">
        <h1 className="mb-1 text-2xl font-bold text-white">Entrar</h1>
        <p className="mb-6 text-sm text-white/40">
          Não tem conta?{' '}
          <Link href="/register" className="text-purple-400 hover:underline">
            Cadastrar-se
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-white/60">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
