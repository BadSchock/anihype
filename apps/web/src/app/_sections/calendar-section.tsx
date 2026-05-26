'use client';

import { useWeeklyCalendar } from '@/hooks/use-episodes';
import { EpisodeCard, EpisodeCardSkeleton } from '@/components/episode/episode-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

function formatDay(dateStr: string) {
  if (dateStr === 'unknown') return 'Data desconhecida';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
}

export function CalendarSection() {
  const { data: calendar, isLoading, isError, refetch } = useWeeklyCalendar(7);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold text-white">Calendário Semanal</h2>

      {isError && (
        <ErrorState message="Não foi possível carregar o calendário." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="flex flex-col gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="mb-3 h-5 w-32 animate-pulse rounded bg-white/10" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((__, j) => (
                  <EpisodeCardSkeleton key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && (!calendar || calendar.length === 0) && (
        <EmptyState
          title="Sem lançamentos na semana"
          description="Nenhum episódio programado para os próximos 7 dias."
        />
      )}

      {!isLoading && !isError && calendar && calendar.length > 0 && (
        <div className="flex flex-col gap-8">
          {calendar.map((day) => (
            <div key={day.date}>
              <h3 className="mb-3 text-sm font-semibold capitalize text-purple-400">
                {formatDay(day.date)}
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {day.episodes.map((ep) => (
                  <EpisodeCard key={ep.id} episode={ep} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
