import { useQuery } from '@tanstack/react-query';
import { getAnimeBySlug, getAnimeList } from '@/services/api';

export function useAnimeList(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['anime', 'list', params],
    queryFn: () => getAnimeList(params),
  });
}

export function useAnime(slug: string) {
  return useQuery({
    queryKey: ['anime', slug],
    queryFn: () => getAnimeBySlug(slug),
    enabled: !!slug,
  });
}
