'use client';

import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { TopAnimeSection } from '@/components/profile/top-anime-section';
import { FollowingSection } from '@/components/profile/following-section';
import { HypeBadge } from '@/components/profile/hype-badge';
import { UserActivitySection } from '@/components/profile/user-activity-section';

interface Props {
  username: string;
  userId: number;
}

export function ProfileClient({ username, userId }: Props) {
  const { user, authReady } = useAuthHydrated();
  const isOwner = authReady && user?.id === userId;

  return (
    <>
      <HypeBadge username={username} className="mt-6" />
      <TopAnimeSection username={username} isOwner={isOwner} />
      <FollowingSection username={username} />
      <UserActivitySection username={username} />
    </>
  );
}
