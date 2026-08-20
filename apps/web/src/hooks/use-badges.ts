'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { equipBadge, getUserBadges } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import type { AwardedBadge } from '@/types/api';
import { showBadgeUnlock } from '@/lib/badge-toast';

export function useUserBadges(username: string) {
  return useQuery({
    queryKey: ['badges', username],
    queryFn: () => getUserBadges(username),
    enabled: !!username,
    staleTime: 1000 * 30,
  });
}

export function useEquipBadge(username: string) {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: (badgeId: number | null) => equipBadge(badgeId, accessToken ?? ''),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['badges', username] });
      // Equipped chip is read from live profile on comments / reviews / ranking
      void qc.invalidateQueries({ queryKey: ['comments'] });
      void qc.invalidateQueries({ queryKey: ['ratings'] });
      void qc.invalidateQueries({ queryKey: ['ranking', 'users'] });
      void qc.invalidateQueries({ queryKey: ['public-profile', username] });
      void qc.invalidateQueries({ queryKey: ['profile', username] });
    },
  });
}

/** Call after mutations that may unlock achievements. */
export function notifyAwardedBadges(awarded?: AwardedBadge[] | null) {
  if (!awarded?.length) return;
  for (const badge of awarded) {
    showBadgeUnlock(badge);
  }
}

export function useInvalidateBadges() {
  const qc = useQueryClient();
  const username = useAuthStore((s) => s.user?.username);
  return () => {
    if (username) void qc.invalidateQueries({ queryKey: ['badges', username] });
  };
}
