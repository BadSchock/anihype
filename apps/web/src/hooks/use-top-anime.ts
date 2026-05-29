'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getUserTopAnime, setMyTopAnime } from '@/services/api';
import type { SetTopAnimePayload } from '@/types/api';

export function useUserTopAnime(username: string) {
  return useQuery({
    queryKey: ['top-anime', username],
    queryFn: () => getUserTopAnime(username),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetTopAnime(username: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetTopAnimePayload) => setMyTopAnime(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['top-anime', username] });
    },
  });
}
