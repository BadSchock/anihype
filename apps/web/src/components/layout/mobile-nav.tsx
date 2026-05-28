'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@anihype/ui';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';

const MOBILE_NAV = [
  { href: '/', label: 'Início', icon: '⚡' },
  { href: '/anime', label: 'Animes', icon: '🎬' },
  { href: '/calendar', label: 'Calendário', icon: '📅' },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { hydrated, isAuthenticated, user } = useAuthHydrated();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Placeholder idêntico no SSR e no 1º paint — evita mismatch
  if (!mounted) {
    return (
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 h-16 border-t border-border bg-background/95 sm:hidden"
        aria-hidden
      />
    );
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-md sm:hidden"
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

      {!hydrated || !isAuthenticated ? (
        <Link
          href="/login"
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
            pathname === '/login' ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span className="text-lg leading-none">👤</span>
          Entrar
        </Link>
      ) : (
        <Link
          href={`/u/${user?.username}`}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
            pathname.startsWith('/u/') ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
          Perfil
        </Link>
      )}
    </nav>
  );
}
