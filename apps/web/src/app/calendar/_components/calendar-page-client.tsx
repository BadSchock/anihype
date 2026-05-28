'use client';

import { useState } from 'react';
import { useWeeklyCalendar } from '@/hooks/use-episodes';
import { EpisodeGridCard, EpisodeGridCardSkeleton } from '@/components/episode/episode-carousel';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { formatCalendarDay, isTodayBrt } from '@/lib/date-brt';

const DAY_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 10, label: '10 dias' },
  { value: 14, label: '14 dias' },
];

export function CalendarPageClient() {
  const [days, setDays] = useState(7);
  const { data: calendar, isLoading, isError, refetch } = useWeeklyCalendar(days);

  const totalEpisodes = calendar?.reduce((acc, day) => acc + day.episodes.length, 0) ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Controles */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {!isLoading && !isError && `${totalEpisodes} episódio${totalEpisodes !== 1 ? 's' : ''} programado${totalEpisodes !== 1 ? 's' : ''}`}
        </p>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {DAY_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setDays(o.value)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                days === o.value
                  ? 'bg-purple-600 text-white'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <ErrorState message="Não foi possível carregar o calendário." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="flex flex-col gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="mb-3 h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((__, j) => (
                  <EpisodeGridCardSkeleton key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && (!calendar || calendar.length === 0) && (
        <EmptyState
          title="Sem lançamentos"
          description={`Nenhum episódio programado para os próximos ${days} dias.`}
        />
      )}

      {!isLoading && !isError && calendar && calendar.length > 0 && (
        <div className="flex flex-col gap-10">
          {calendar.map((day) => (
            <div key={day.date}>
              <div className="mb-3 flex items-center gap-3">
                <h2
                  className={`text-sm font-semibold capitalize ${
                    isTodayBrt(day.date) ? 'text-purple-400' : 'text-muted-foreground'
                  }`}
                >
                  {formatCalendarDay(day.date)}
                </h2>
                {isTodayBrt(day.date) && (
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-400">
                    hoje
                  </span>
                )}
                <span className="text-xs text-muted-foreground/50">
                  {day.episodes.length} ep{day.episodes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {day.episodes.map((ep) => (
                  <EpisodeGridCard key={ep.id} episode={ep} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
