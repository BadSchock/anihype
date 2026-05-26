'use client';

import Link from 'next/link';
import { useAnimeList } from '@/hooks/use-anime';
import { AnimeCard, AnimeCardSkeleton } from '@/components/anime/anime-card';
import { EmptyState } from '@/components/ui/empty-state';

export function TrendingSection() {
  const { data, isLoading } = useAnimeList({ orderBy: 'popular', limit: 12, status: 'AIRING' });

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Em Exibição</h2>
        <Link href="/anime" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
          Ver todos →
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && (!data?.data || data.data.length === 0) && (
        <EmptyState
          title="Nenhum anime em exibição"
          description="Use o sync para importar animes da temporada."
        />
      )}

      {!isLoading && data?.data && data.data.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {data.data.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
        </div>
      )}
    </section>
  );
}
