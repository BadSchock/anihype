'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useLogout } from '@/hooks/use-auth';
import { cn } from '@anihype/ui';

export function NavbarClient() {
  const pathname = usePathname();
  const { hydrated, isAuthenticated, user } = useAuthHydrated();
  const { mutate: doLogout } = useLogout();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isAdmin = hydrated && !!user?.roles.includes('ADMIN');
  const showAuth = mounted && hydrated;

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
      {mounted && isAdmin && (
        <Link
          href="/admin"
          className={cn(
            'hidden px-1 py-0.5 text-sm font-medium transition-colors sm:block',
            pathname.startsWith('/admin')
              ? 'text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          Admin
        </Link>
      )}

      {mounted && (
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Alternar tema"
          className="btn-ghost px-2.5 py-1.5 text-base"
          title={theme === 'system' ? 'Tema: sistema' : theme === 'dark' ? 'Tema escuro' : 'Tema claro'}
        >
          {resolvedTheme === 'dark' ? '☀️' : '🌙'}
        </button>
      )}

      {!showAuth ? (
        <>
          <Link
            href="/login"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Entrar
          </Link>
          <Link href="/register" className="btn-primary py-1.5 text-xs">
            Cadastrar
          </Link>
        </>
      ) : isAuthenticated ? (
        <>
          <Link
            href={`/u/${user?.username}`}
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {user?.username}
          </Link>
          <button type="button" onClick={() => doLogout()} className="btn-ghost py-1.5 text-xs">
            Sair
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Entrar
          </Link>
          <Link href="/register" className="btn-primary py-1.5 text-xs">
            Cadastrar
          </Link>
        </>
      )}
    </div>
  );
}
