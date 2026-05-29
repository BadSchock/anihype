'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/hooks/use-auth';

const USERNAME_RE = /^[a-z0-9_-]+$/i;

function validateRegisterForm(form: {
  username: string;
  email: string;
  password: string;
  confirm: string;
}): string | null {
  const username = form.username.trim();
  if (username.length < 3) return 'Username deve ter no mínimo 3 caracteres';
  if (username.length > 32) return 'Username deve ter no máximo 32 caracteres';
  if (!USERNAME_RE.test(username)) {
    return 'Username só pode conter letras, números, _ e -';
  }
  if (form.password.length < 8) return 'A senha deve ter no mínimo 8 caracteres';
  if (form.password.length > 128) return 'A senha deve ter no máximo 128 caracteres';
  if (form.password !== form.confirm) return 'As senhas não coincidem';
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { mutate: doRegister, isPending } = useRegister();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateRegisterForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    doRegister(
      {
        username: form.username.trim().toLowerCase(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      },
      {
        onSuccess: () => router.push('/'),
        onError: (err) => setError(err.message),
      },
    );
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="rounded-2xl border border-border bg-card p-8">
        <h1 className="mb-1 text-2xl font-bold text-foreground">Criar conta</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Já tem conta?{' '}
          <Link href="/login" className="text-purple-400 hover:underline">
            Entrar
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Username</label>
            <input
              value={form.username}
              onChange={set('username')}
              required
              minLength={3}
              maxLength={32}
              autoComplete="username"
              placeholder="seunick"
              className="input-base"
            />
            <p className="mt-1 text-xs text-muted-foreground/70">
              3–32 caracteres · letras, números, _ e -
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              autoComplete="email"
              placeholder="seu@email.com"
              className="input-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              placeholder="Mín. 8 caracteres"
              className="input-base"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Confirmar senha</label>
            <input
              type="password"
              value={form.confirm}
              onChange={set('confirm')}
              required
              autoComplete="new-password"
              placeholder="Repita a senha"
              className="input-base"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button type="submit" disabled={isPending} className="btn-primary mt-2 w-full py-2.5">
            {isPending ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
