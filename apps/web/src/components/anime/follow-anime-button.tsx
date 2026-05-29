'use client';

import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@anihype/ui';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useAnimeFollowStatus, useToggleAnimeFollow } from '@/hooks/use-anime-follow';
import { buildLoginUrl } from '@/lib/auth-url';

interface Props {
  slug: string;
  className?: string;
}

export function FollowAnimeButton({ slug, className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { authReady, isAuthenticated, user } = useAuthHydrated();
  const { data: status, isLoading } = useAnimeFollowStatus(slug);
  const { mutateAsync: toggle, isPending } = useToggleAnimeFollow(slug, user?.username);

  const following = status?.following ?? false;

  async function handleClick() {
    if (!isAuthenticated) {
      router.push(buildLoginUrl(pathname));
      return;
    }
    await toggle(following);
  }

  if (!authReady) {
    return (
      <div className={cn('h-10 w-28 animate-pulse rounded-xl bg-muted', className)} aria-hidden />
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isLoading || isPending}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-50',
        following
          ? 'border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
          : 'bg-purple-600 text-white hover:bg-purple-700',
        className,
      )}
    >
      {isPending ? '...' : following ? '✓ Seguindo' : '+ Seguir'}
    </button>
  );
}
