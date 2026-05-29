'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  followUser,
  getUserFollowStatus,
  getUserSocialCounts,
  unfollowUser,
} from '@/services/api';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';

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

  return useMutation({
    mutationFn: async (following: boolean) => {
      if (following) return unfollowUser(username);
      return followUser(username);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['user-follow', username] });
      void qc.invalidateQueries({ queryKey: ['social-counts', username] });
      void qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
