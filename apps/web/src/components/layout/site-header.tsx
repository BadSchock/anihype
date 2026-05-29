'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { cn } from '@anihype/ui';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useLogout } from '@/hooks/use-auth';
import { NotificationsBell } from '@/components/layout/notifications-bell';
import { buildLoginUrl } from '@/lib/auth-url';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/feed', label: 'Feed', authOnly: true },
  { href: '/anime', label: 'Animes' },
  { href: '/calendar', label: 'Calendario' },
] as const;

function AuthSkeleton() {
  return (
    <div className="flex items-center gap-2" aria-hidden>
      <div className="hidden h-4 w-12 animate-pulse rounded bg-muted sm:block" />
      <div className="h-8 w-[4.5rem] animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { authReady, isAuthenticated, user } = useAuthHydrated();
  const { mutate: doLogout, isPending: loggingOut } = useLogout();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isAdmin = authReady && !!user?.roles?.includes('ADMIN');
  const showAuth = mounted && authReady;
  const currentPath = pathname ?? '/';

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex-shrink-0 text-xl font-black tracking-tight text-foreground">
          Ani<span className="text-gradient">Hype</span>
        </Link>

        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="hidden items-center gap-6 sm:flex" aria-label="Principal">
            {NAV_LINKS.filter((link) => !('authOnly' in link && link.authOnly) || isAuthenticated).map((link) => {
              const active =
                currentPath === link.href ||
                (link.href !== '/' && currentPath.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-1 py-0.5 text-sm font-medium transition-colors duration-150',
                    active
                      ? 'text-foreground underline decoration-purple-500 decoration-2 underline-offset-4'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
            {mounted && isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  'hidden px-1 py-0.5 text-sm font-medium transition-colors sm:block',
                  currentPath.startsWith('/admin')
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
                title={
                  theme === 'system'
                    ? 'Tema: sistema'
                    : theme === 'dark'
                      ? 'Tema escuro'
                      : 'Tema claro'
                }
              >
                {resolvedTheme === 'dark' ? 'Claro' : 'Escuro'}
              </button>
            )}

            {!showAuth ? (
              <AuthSkeleton />
            ) : isAuthenticated ? (
              <>
                <NotificationsBell />
                <Link
                  href={`/u/${user?.username}`}
                  className="hidden max-w-[120px] truncate text-sm text-muted-foreground transition-colors hover:text-foreground sm:block"
                >
                  {user?.username}
                </Link>
                <button
                  type="button"
                  onClick={() => doLogout()}
                  disabled={loggingOut}
                  className="btn-ghost py-1.5 text-xs disabled:opacity-50"
                >
                  {loggingOut ? '...' : 'Sair'}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={buildLoginUrl(currentPath)}
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
        </div>
      </nav>
    </header>
  );
}
