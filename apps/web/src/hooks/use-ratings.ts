import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getAnimeRatings,
  getMyAnimeRating,
  upsertAnimeRating,
  deleteAnimeRating,
  type CreateRatingPayload,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

export function useAnimeRatings(slug: string) {
  return useQuery({
    queryKey: ['ratings', slug],
    queryFn: () => getAnimeRatings(slug),
    enabled: !!slug,
  });
}

export function useMyRating(slug: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['ratings', slug, 'me'],
    queryFn: () => getMyAnimeRating(slug, accessToken!),
    enabled: !!slug && !!accessToken,
  });
}

export function useUpsertRating(slug: string) {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: (payload: CreateRatingPayload) =>
      upsertAnimeRating(slug, payload, accessToken!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ratings', slug] });
    },
  });
}

export function useDeleteRating(slug: string) {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: () => deleteAnimeRating(slug, accessToken!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ratings', slug] });
    },
  });
}
