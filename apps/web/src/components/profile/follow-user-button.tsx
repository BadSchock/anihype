'use client';

import { useUserFollowStatus, useToggleUserFollow } from '@/hooks/use-user-follow';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { buildLoginUrl } from '@/lib/auth-url';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@anihype/ui';

interface Props {
  username: string;
  isOwner: boolean;
  className?: string;
}

export function FollowUserButton({ username, isOwner, className }: Props) {
  const { isAuthenticated } = useAuthHydrated();
  const pathname = usePathname();
  const router = useRouter();
  const { data: status } = useUserFollowStatus(username);
  const { mutateAsync: toggle, isPending } = useToggleUserFollow(username);

  if (isOwner) return null;

  const following = status?.following ?? false;

  async function handleClick() {
    if (!isAuthenticated) {
      router.push(buildLoginUrl(pathname ?? `/u/${username}`));
      return;
    }
    await toggle(following);
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={isPending}
      className={cn(
        'rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
        following
          ? 'border border-purple-500/40 bg-purple-500/10 text-purple-200 hover:bg-purple-500/20'
          : 'bg-purple-600 text-white hover:bg-purple-500',
        className,
      )}
    >
      {isPending ? '...' : following ? '✓ Seguindo' : '+ Seguir'}
    </button>
  );
}
