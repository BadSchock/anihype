'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRegister, useLogin } from '@/hooks/use-auth';

export default function RegisterPage() {
  const router = useRouter();
  const { mutate: doRegister, isPending: registering } = useRegister();
  const { mutate: doLogin, isPending: logging } = useLogin();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const isPending = registering || logging;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('As senhas não coincidem');
      return;
    }
    if (form.password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres');
      return;
    }

    doRegister(
      { username: form.username, email: form.email, password: form.password },
      {
        onSuccess: () => {
          // Após cadastro, loga automaticamente
          doLogin(
            { email: form.email, password: form.password },
            { onSuccess: () => router.push('/') },
          );
        },
        onError: (err) => setError(err.message),
      },
    );
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="rounded-2xl bg-white/5 p-8">
        <h1 className="mb-1 text-2xl font-bold text-white">Criar conta</h1>
        <p className="mb-6 text-sm text-white/40">
          Já tem conta?{' '}
          <Link href="/login" className="text-purple-400 hover:underline">
            Entrar
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-white/60">Username</label>
            <input
              value={form.username}
              onChange={set('username')}
              required
              minLength={3}
              maxLength={30}
              placeholder="seunick"
              className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder="seu@email.com"
              className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
              placeholder="Mín. 8 caracteres"
              className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/60">Confirmar senha</label>
            <input
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              required
              placeholder="Repita a senha"
              className="w-full rounded-lg bg-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="mt-2 w-full rounded-lg bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
