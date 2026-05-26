import { useQuery } from '@tanstack/react-query';
import { getAnimeEpisodes, getTodayReleases, getWeeklyCalendar } from '@/services/api';

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

export function useAnimeEpisodes(animeId: number, page = 1) {
  return useQuery({
    queryKey: ['anime', animeId, 'episodes', page],
    queryFn: () => getAnimeEpisodes(animeId, page),
    enabled: animeId > 0,
  });
}
