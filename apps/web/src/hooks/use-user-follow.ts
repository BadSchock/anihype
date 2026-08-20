'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  followUser,
  getUserFollowStatus,
  getUserSocialCounts,
  unfollowUser,
} from '@/services/api';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { notifyAwardedBadges } from '@/hooks/use-badges';
import { useAuthStore } from '@/stores/auth.store';
import type { AwardedBadge } from '@/types/api';

export function useUserSocialCounts(username: string) {
  return useQuery({
    queryKey: ['social-counts', username],
    queryFn: () => getUserSocialCounts(username),
    staleTime: 60_000,
  });
}

export function useUserFollowStatus(username: string) {
  const { isAuthenticated } = useAuthHydrated();

  return useQuery({
    queryKey: ['user-follow', username],
    queryFn: () => getUserFollowStatus(username),
    enabled: isAuthenticated,
  });
}

export function useToggleUserFollow(username: string) {
  const qc = useQueryClient();
  const me = useAuthStore((s) => s.user?.username);

  return useMutation({
    mutationFn: async (following: boolean) => {
      if (following) return unfollowUser(username);
      return followUser(username);
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['user-follow', username] });
      void qc.invalidateQueries({ queryKey: ['social-counts', username] });
      void qc.invalidateQueries({ queryKey: ['feed'] });
      if (me) void qc.invalidateQueries({ queryKey: ['badges', me] });
      notifyAwardedBadges((data as { awardedBadges?: AwardedBadge[] }).awardedBadges);
    },
  });
}
