'use client';

import { useUserSocialCounts } from '@/hooks/use-user-follow';

interface Props {
  username: string;
}

export function ProfileSocialStats({ username }: Props) {
  const { data } = useUserSocialCounts(username);

  if (!data) return null;

  return (
    <div className="mt-4 flex justify-center gap-6 sm:justify-start">
      <div className="text-center sm:text-left">
        <p className="text-lg font-bold text-foreground">{data.followerCount}</p>
        <p className="text-xs text-muted-foreground">seguidores</p>
      </div>
      <div className="text-center sm:text-left">
        <p className="text-lg font-bold text-foreground">{data.followingCount}</p>
        <p className="text-xs text-muted-foreground">seguindo</p>
      </div>
    </div>
  );
}
