'use client';

import Link from 'next/link';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@anihype/ui';
import { UserAvatar } from '@/components/user/user-avatar';
import { useLogout } from '@/hooks/use-auth';
import type { AuthUser } from '@/types/api';

export function ThemeSelector({ className }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const dark = resolvedTheme !== 'light';
  const Icon = dark ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'Usar tema claro' : 'Usar tema escuro'}
      title={dark ? 'Tema escuro' : 'Tema claro'}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
        className,
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );
}

export function UserBar({ user }: { user: AuthUser }) {
  const { mutate: doLogout, isPending: loggingOut } = useLogout();
  const nickname = user.displayName?.trim() || user.username;

  return (
    <div className="flex min-w-0 items-center gap-1 rounded-full border border-border bg-card/80 py-1 pl-1 pr-1.5 sm:gap-1.5 sm:pr-2">
      <Link
        href={`/u/${user.username}`}
        className="flex min-w-0 items-center gap-2 rounded-full pr-1 transition-colors hover:text-purple-300"
        title={`@${user.username}`}
      >
        <span className="relative inline-flex h-9 w-9 shrink-0 items-center justify-center">
          <span
            data-slot="profile-frame"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-primary/45 ring-offset-2 ring-offset-background"
          />
          <UserAvatar
            name={nickname}
            avatarUrl={user.avatarUrl}
            size="sm"
            className="h-7 w-7 ring-0"
          />
        </span>
        <span className="max-w-[5.5rem] truncate text-sm font-semibold text-foreground sm:max-w-[9rem]">
          {nickname}
        </span>
      </Link>

      <ThemeSelector />

      <button
        type="button"
        onClick={() => doLogout()}
        disabled={loggingOut}
        aria-label="Sair"
        className="inline-flex h-8 items-center gap-1.5 rounded-full px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        <span className="hidden sm:inline">{loggingOut ? 'Saindo...' : 'Sair'}</span>
      </button>
    </div>
  );
}
