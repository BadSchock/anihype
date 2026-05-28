import Link from 'next/link';
import { NavbarClient } from './navbar-client';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/anime', label: 'Animes' },
  { href: '/calendar', label: 'Calendário' },
] as const;

/**
 * Header com links estáticos renderizados no servidor.
 * Auth/tema/admin ficam no NavbarClient — evita mismatch de hidratação
 * quando o bundle JS do cliente está desatualizado.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex-shrink-0 text-xl font-black tracking-tight text-foreground">
          Ani<span className="text-gradient">Hype</span>
        </Link>

        <div className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative px-1 py-0.5 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <NavbarClient />
      </nav>
    </header>
  );
}
