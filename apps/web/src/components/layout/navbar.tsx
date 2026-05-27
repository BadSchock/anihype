'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '@/hooks/use-auth';
import { cn } from '@anihype/ui';

const NAV_LINKS = [
  { href: '/',          label: 'Início' },
  { href: '/anime',     label: 'Animes' },
  { href: '/calendar',  label: 'Calendário' },
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        'relative px-1 py-0.5 text-sm font-medium transition-colors duration-150',
        active ? 'text-white' : 'text-white/50 hover:text-white/80',
      )}
    >
      {label}
      {active && (
        <span className="absolute -bottom-[17px] left-0 right-0 h-[2px] rounded-full bg-purple-500" />
      )}
    </Link>
  );
}

export function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const { mutate: doLogout } = useLogout();
  const isAdmin = user?.roles.includes('ADMIN');

  return (
    <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0F1115]/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 text-xl font-black tracking-tight text-white">
          Ani<span className="text-gradient">Hype</span>
        </Link>

        {/* Links desktop */}
        <div className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
          {isAdmin && <NavLink href="/admin" label="Admin" />}
        </div>

        {/* Auth desktop */}
        <div className="flex flex-shrink-0 items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href={`/u/${user?.username}`}
                className="hidden text-sm text-white/50 transition-colors hover:text-white sm:block"
              >
                {user?.username}
              </Link>
              <button
                onClick={() => doLogout()}
                className="btn-ghost py-1.5 text-xs"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden text-sm text-white/50 hover:text-white transition-colors sm:block">
                Entrar
              </Link>
              <Link href="/register" className="btn-primary py-1.5 text-xs">
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
