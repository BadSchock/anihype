'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@anihype/ui';
import { useAuthStore } from '@/stores/auth.store';

const MOBILE_NAV = [
  { href: '/',       label: 'Início',     icon: '⚡' },
  { href: '/anime',  label: 'Animes',     icon: '🎬' },
  { href: '/login',  label: 'Entrar',     icon: '👤', authHide: true },
];

const MOBILE_NAV_AUTH = [
  { href: '/',       label: 'Início',    icon: '⚡' },
  { href: '/anime',  label: 'Animes',    icon: '🎬' },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const links = isAuthenticated ? MOBILE_NAV_AUTH : MOBILE_NAV.filter((l) => !l.authHide || !isAuthenticated);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-stretch border-t border-white/6 bg-[#0F1115]/95 backdrop-blur-md sm:hidden"
      aria-label="Navegação mobile"
    >
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
              active ? 'text-purple-400' : 'text-white/40 hover:text-white/70',
            )}
          >
            <span className="text-lg leading-none">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
      {/* Perfil ou Login */}
      {isAuthenticated ? (
        <Link
          href={`/u/${user?.username}`}
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
            pathname.startsWith('/u/') ? 'text-purple-400' : 'text-white/40 hover:text-white/70',
          )}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/30 text-xs font-bold text-purple-300">
            {user?.username?.charAt(0).toUpperCase()}
          </span>
          Perfil
        </Link>
      ) : (
        <Link
          href="/login"
          className={cn(
            'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
            pathname === '/login' ? 'text-purple-400' : 'text-white/40 hover:text-white/70',
          )}
        >
          <span className="text-lg leading-none">👤</span>
          Entrar
        </Link>
      )}
    </nav>
  );
}
