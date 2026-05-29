'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserHype } from '@/services/api';

export function useUserHype(username: string) {
  return useQuery({
    queryKey: ['hype', username],
    queryFn: () => getUserHype(username),
    enabled: !!username,
    staleTime: 1000 * 30,
  });
}
