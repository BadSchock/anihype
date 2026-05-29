'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyFeed, getUserActivity } from '@/services/api';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';

export function useMyFeed(page = 1) {
  const { isAuthenticated } = useAuthHydrated();

  return useQuery({
    queryKey: ['feed', 'me', page],
    queryFn: () => getMyFeed(page),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useUserActivity(username: string, page = 1) {
  return useQuery({
    queryKey: ['activity', username, page],
    queryFn: () => getUserActivity(username, page),
    staleTime: 60_000,
  });
}
