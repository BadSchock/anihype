'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { followAnime, getAnimeFollowStatus, getUserFollowing, unfollowAnime } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { notifyAwardedBadges } from '@/hooks/use-badges';
import type { AwardedBadge } from '@/types/api';

export function useAnimeFollowStatus(slug: string) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['follow', slug, 'me'],
    queryFn: () => getAnimeFollowStatus(slug),
    enabled: authReady && isAuthenticated && !!slug,
  });
}

export function useToggleAnimeFollow(slug: string, username?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (currentlyFollowing: boolean) =>
      currentlyFollowing ? unfollowAnime(slug) : followAnime(slug),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['follow', slug, 'me'] });
      if (username) {
        void qc.invalidateQueries({ queryKey: ['following', username] });
        void qc.invalidateQueries({ queryKey: ['hype', username] });
        void qc.invalidateQueries({ queryKey: ['badges', username] });
      }
      notifyAwardedBadges((data as { awardedBadges?: AwardedBadge[] }).awardedBadges);
    },
  });
}

export function useUserFollowing(username: string) {
  return useQuery({
    queryKey: ['following', username],
    queryFn: () => getUserFollowing(username),
    enabled: !!username,
    staleTime: 1000 * 60 * 2,
  });
}
