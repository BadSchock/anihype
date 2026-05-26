'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';

export function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { mutate: doLogout } = useLogout();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0F1115]/90 backdrop-blur-sm">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            Ani<span className="text-purple-400">Hype</span>
          </span>
        </Link>

        {/* Links */}
        <div className="hidden items-center gap-6 text-sm text-white/60 sm:flex">
          <Link href="/" className="transition-colors hover:text-white">
            Início
          </Link>
          <Link href="/anime" className="transition-colors hover:text-white">
            Animes
          </Link>
          <Link href="/calendar" className="transition-colors hover:text-white">
            Calendário
          </Link>
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm text-white/50 sm:block">{user?.username}</span>
              <button
                onClick={() => doLogout()}
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition-colors"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-white/60 transition-colors hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
