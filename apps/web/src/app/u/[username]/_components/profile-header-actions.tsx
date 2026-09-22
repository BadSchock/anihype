'use client';

import Link from 'next/link';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { FollowUserButton } from '@/components/profile/follow-user-button';

interface Props {
  username: string;
  userId: number;
}

export function ProfileHeaderActions({ username, userId }: Props) {
  const { authReady, user } = useAuthHydrated();
  const isOwner = authReady && user?.id === userId;

  return (
    <div className="flex flex-shrink-0 items-end pb-1">
      {isOwner ? (
        <Link
          href="/perfil/editar"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Editar perfil
        </Link>
      ) : (
        <FollowUserButton username={username} isOwner={isOwner} />
      )}
    </div>
  );
}
