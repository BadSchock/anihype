import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAnimeRatings,
  getMyAnimeRating,
  upsertAnimeRating,
  deleteAnimeRating,
  type CreateRatingPayload,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import { notifyAwardedBadges } from '@/hooks/use-badges';

export function useAnimeRatings(slug: string) {
  return useQuery({
    queryKey: ['ratings', slug],
    queryFn: () => getAnimeRatings(slug),
    enabled: !!slug,
  });
}

export function useMyRating(slug: string) {
  const authReady = useAuthStore((s) => s.authReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['ratings', slug, 'me'],
    queryFn: () => getMyAnimeRating(slug),
    enabled: authReady && !!slug && isAuthenticated,
  });
}

export function useUpsertRating(slug: string) {
  const qc = useQueryClient();
  const username = useAuthStore((s) => s.user?.username);

  return useMutation({
    mutationFn: (payload: CreateRatingPayload) => upsertAnimeRating(slug, payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['ratings', slug] });
      if (username) {
        void qc.invalidateQueries({ queryKey: ['hype', username] });
        void qc.invalidateQueries({ queryKey: ['badges', username] });
      }
      notifyAwardedBadges(data.awardedBadges);
    },
  });
}

export function useDeleteRating(slug: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => deleteAnimeRating(slug),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ratings', slug] });
    },
  });
}
