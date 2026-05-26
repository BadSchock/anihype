'use client';

import { useTodayReleases } from '@/hooks/use-episodes';
import { EpisodeCard, EpisodeCardSkeleton } from '@/components/episode/episode-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

export function TodaySection() {
  const { data: episodes, isLoading, isError, refetch } = useTodayReleases();

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Lançamentos de Hoje</h2>
        <span className="text-sm text-white/40">
          {episodes?.length ?? 0} episódios
        </span>
      </div>

      {isError && (
        <ErrorState message="Não foi possível carregar os lançamentos." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EpisodeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && !isError && episodes?.length === 0 && (
        <EmptyState
          title="Sem lançamentos hoje"
          description="Nenhum episódio foi ao ar hoje. Confira o calendário semanal."
        />
      )}

      {!isLoading && !isError && episodes && episodes.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {episodes.map((ep) => (
            <EpisodeCard key={ep.id} episode={ep} />
          ))}
        </div>
      )}
    </section>
  );
}
