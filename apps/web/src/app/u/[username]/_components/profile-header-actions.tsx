'use client';

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
      <FollowUserButton username={username} isOwner={isOwner} />
    </div>
  );
}
