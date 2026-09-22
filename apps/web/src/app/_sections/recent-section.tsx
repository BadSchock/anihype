'use client';

import Link from 'next/link';
import { useRecentReleases } from '@/hooks/use-episodes';
import { EpisodeCarousel, EpisodeCarouselSkeleton } from '@/components/episode/episode-carousel';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { formatRecentDay, isTodayBrt, isYesterdayBrt } from '@/lib/date-brt';

export function RecentSection() {
  const { data: recent, isLoading, isError, refetch } = useRecentReleases(7);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground sm:text-xl">Últimos adicionados</h2>
        <Link href="/calendar" className="text-sm text-purple-400 hover:underline">
          Ver calendário →
        </Link>
      </div>

      {isError && (
        <ErrorState message="Não foi possível carregar os lançamentos." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="flex flex-col gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i}>
              <div className="mb-3 h-4 w-28 animate-pulse rounded bg-muted" />
              <div className="flex w-full min-w-0 gap-3 overflow-x-auto">
                {Array.from({ length: 4 }).map((__, j) => (
                  <EpisodeCarouselSkeleton key={j} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && (!recent || recent.length === 0) && (
        <EmptyState
          title="Nenhum lançamento recente"
          description="Nenhum episódio foi ao ar nos últimos 7 dias."
        />
      )}

      {!isLoading && !isError && recent && recent.length > 0 && (
        <div className="flex flex-col gap-8">
          {recent.map((day) => (
            <div key={day.date}>
              <div className="mb-3 flex items-center gap-2">
                <h3
                  className={`text-sm font-semibold capitalize ${
                    isTodayBrt(day.date) ? 'text-purple-400' : 'text-muted-foreground'
                  }`}
                >
                  {formatRecentDay(day.date)}
                </h3>
                {isTodayBrt(day.date) && (
                  <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple-400">
                    hoje
                  </span>
                )}
                {isYesterdayBrt(day.date) && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    ontem
                  </span>
                )}
                <span className="text-xs text-muted-foreground/50">
                  {day.episodes.length} ep{day.episodes.length !== 1 ? 's' : ''}
                </span>
              </div>
              <EpisodeCarousel episodes={day.episodes} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
