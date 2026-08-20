'use client';

import { useQuery } from '@tanstack/react-query';
import { getAnimeRanking, getUserRanking } from '@/services/api';
import type { UserRankingPeriod } from '@/types/api';
import { useAuthStore } from '@/stores/auth.store';

export function useAnimeRanking(limit = 50) {
  return useQuery({
    queryKey: ['ranking', 'anime', limit],
    queryFn: () => getAnimeRanking(limit),
    staleTime: 60_000,
  });
}

export function useUserRanking(period: UserRankingPeriod, limit = 50) {
  const authReady = useAuthStore((s) => s.authReady);
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: ['ranking', 'users', period, limit, accessToken ?? 'guest'],
    queryFn: () => getUserRanking(period, limit),
    enabled: authReady,
    staleTime: 30_000,
  });
}
