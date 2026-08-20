import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAnimeRatings,
  getMyAnimeRating,
  upsertAnimeRating,
  deleteAnimeRating,
  type CreateRatingPayload,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

export function useAnimeRatings(
  slug: string,
  opts: { page?: number; limit?: number; sort?: 'recent' | 'score' } = {},
) {
  const page = opts.page ?? 1;
  const limit = opts.limit ?? 20;
  const sort = opts.sort ?? 'recent';
  return useQuery({
    queryKey: ['ratings', slug, page, limit, sort],
    queryFn: () => getAnimeRatings(slug, page, limit, sort),
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
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ratings', slug] });
      if (username) void qc.invalidateQueries({ queryKey: ['hype', username] });
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
