'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@anihype/ui';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useLogout } from '@/hooks/use-auth';
import { buildLoginUrl } from '@/lib/auth-url';

const MOBILE_NAV = [
  { href: '/', label: 'Início', icon: '⚡' },
  { href: '/anime', label: 'Animes', icon: '🎬' },
  { href: '/ranking', label: 'Ranking', icon: '🏆' },
  { href: '/calendar', label: 'Calendário', icon: '📅' },
] as const;

function UserMobileNavItem() {
  const pathname = usePathname();
  const { authReady, isAuthenticated, user } = useAuthHydrated();
  const { mutate: doLogout, isPending: loggingOut } = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!authReady) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1">
        <div className="h-6 w-6 animate-pulse rounded-full bg-muted" />
        <div className="h-2 w-8 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link
        href={buildLoginUrl(pathname)}
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
          pathname === '/login' ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span className="text-lg leading-none">👤</span>
        Entrar
      </Link>
    );
  }

  return (
    <div className="relative flex flex-1">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
          pathname.startsWith('/u/') || menuOpen
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground',
        )}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
          {user?.username?.charAt(0).toUpperCase()}
        </span>
        Conta
      </button>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div
            role="menu"
            className="absolute bottom-full right-0 z-50 mb-2 min-w-[140px] overflow-hidden rounded-xl border border-border bg-background shadow-lg"
          >
            <Link
              href={`/u/${user?.username}`}
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Meu perfil
            </Link>
            <Link
              href="/perfil/editar"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted"
            >
              Editar perfil
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={loggingOut}
              onClick={() => {
                setMenuOpen(false);
                doLogout();
              }}
              className="block w-full px-4 py-3 text-left text-sm text-red-400 transition-colors hover:bg-muted disabled:opacity-50"
            >
              {loggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom,0px)] sm:hidden"
        aria-hidden
      />
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md sm:hidden"
      aria-label="Navegação mobile"
    >
      {MOBILE_NAV.map((l) => {
        const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <span className="text-lg leading-none">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}

      <UserMobileNavItem />
    </nav>
  );
}
