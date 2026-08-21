import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { getAnimeBySlug, getAnimeList, getGenres } from '@/services/api';

export function useAnimeList(params: Record<string, string | number | undefined> = {}) {
  return useQuery({
    queryKey: ['anime', 'list', params],
    queryFn: () => getAnimeList(params),
  });
}

export function useInfiniteAnimeList(
  params: Record<string, string | number | undefined> = {},
  limit = 24,
) {
  const { page: _page, limit: _limit, ...filters } = params;
  return useInfiniteQuery({
    queryKey: ['anime', 'infinite', filters, limit],
    queryFn: ({ pageParam }) =>
      getAnimeList({
        ...filters,
        page: pageParam,
        limit,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
    staleTime: 1000 * 60 * 30,
  });
}

export function useAnime(slug: string) {
  return useQuery({
    queryKey: ['anime', slug],
    queryFn: () => getAnimeBySlug(slug),
    enabled: !!slug,
  });
}

export function useAnimeSearch(q: string, debounceMs = 350) {
  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), debounceMs);
    return () => clearTimeout(id);
  }, [q, debounceMs]);

  return useQuery({
    queryKey: ['anime', 'search', debouncedQ],
    queryFn: () => getAnimeList({ search: debouncedQ, limit: 20 }),
    enabled: debouncedQ.length >= 2,
    select: (res) => res.data,
    staleTime: 1000 * 30,
  });
}
