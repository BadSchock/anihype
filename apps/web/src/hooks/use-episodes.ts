import { useQuery } from '@tanstack/react-query';
import { getAnimeEpisodes, getHotComments, getRecentReleases, getTodayReleases, getTrendingEpisodes, getWeeklyCalendar } from '@/services/api';

export function useTodayReleases() {
  return useQuery({
    queryKey: ['episodes', 'today'],
    queryFn: getTodayReleases,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeeklyCalendar(days = 7) {
  return useQuery({
    queryKey: ['episodes', 'calendar', days],
    queryFn: () => getWeeklyCalendar(days),
    staleTime: 10 * 60 * 1000,
  });
}

export function useRecentReleases(days = 7) {
  return useQuery({
    queryKey: ['episodes', 'recent', days],
    queryFn: () => getRecentReleases(days),
    staleTime: 10 * 60 * 1000,
  });
}

export function useAnimeEpisodes(animeId: number, page = 1) {
  return useQuery({
    queryKey: ['anime', animeId, 'episodes', page],
    queryFn: () => getAnimeEpisodes(animeId, page),
    enabled: animeId > 0,
  });
}

export function useTrendingEpisodes(days = 7, limit = 12) {
  return useQuery({
    queryKey: ['episodes', 'trending', days, limit],
    queryFn: () => getTrendingEpisodes(days, limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useHotComments(limit = 8, days = 7) {
  return useQuery({
    queryKey: ['comments', 'hot', limit, days],
    queryFn: () => getHotComments(limit, days),
    staleTime: 3 * 60 * 1000,
  });
}
