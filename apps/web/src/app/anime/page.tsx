'use client';

import { useState } from 'react';
import { useAnimeList } from '@/hooks/use-anime';
import { AnimeCard, AnimeCardSkeleton } from '@/components/anime/anime-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

const ORDER_OPTIONS = [
  { value: 'popular', label: 'Mais populares' },
  { value: 'score', label: 'Melhor score' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'title', label: 'A-Z' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'AIRING', label: 'Em exibição' },
  { value: 'FINISHED', label: 'Finalizado' },
  { value: 'NOT_YET_AIRED', label: 'Em breve' },
];

export default function AnimeListPage() {
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('popular');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAnimeList({
    search: search || undefined,
    orderBy,
    status: status || undefined,
    page,
    limit: 24,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Animes</h1>

        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar anime..."
            className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
          />
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#1a1d24]">
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={orderBy}
            onChange={(e) => { setOrderBy(e.target.value); setPage(1); }}
            className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500"
          >
            {ORDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[#1a1d24]">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isError && (
        <ErrorState message="Não foi possível carregar os animes." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 24 }).map((_, i) => <AnimeCardSkeleton key={i} />)}
        </div>
      )}

      {!isLoading && !isError && (!data?.data || data.data.length === 0) && (
        <EmptyState title="Nenhum anime encontrado" description="Tente ajustar os filtros." />
      )}

      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.data.map((anime) => <AnimeCard key={anime.id} anime={anime} />)}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-sm text-white/50">{page} / {data.meta.totalPages}</span>
              <button
                disabled={page === data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
              >
                Próximo →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
