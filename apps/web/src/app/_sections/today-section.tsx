'use client';

import Link from 'next/link';
import { useTodayReleases } from '@/hooks/use-episodes';
import { EpisodeCarousel, EpisodeCarouselSkeleton } from '@/components/episode/episode-carousel';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

export function TodaySection() {
  const { data: episodes, isLoading, isError, refetch } = useTodayReleases();

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Lançamentos de Hoje</h2>
        <Link href="/calendar" className="text-sm text-purple-400 hover:underline">
          Ver todos →
        </Link>
      </div>

      {isError && (
        <ErrorState message="Não foi possível carregar os lançamentos." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <EpisodeCarouselSkeleton key={i} />
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
        <EpisodeCarousel episodes={episodes} />
      )}
    </section>
  );
}
