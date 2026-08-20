'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAnimeList } from '@/hooks/use-anime';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { AnimeCard, AnimeCardSkeleton } from '@/components/anime/anime-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

const CURRENT_YEAR = new Date().getFullYear();

const STATUS_CHIPS = [
  { value: '', label: 'Todos' },
  { value: 'AIRING', label: '▶ Em exibição' },
  { value: 'NOT_YET_AIRED', label: '🔜 Em breve' },
  { value: 'FINISHED', label: '✓ Finalizado' },
];

const FORMAT_CHIPS = [
  { value: '', label: 'Todos' },
  { value: 'TV', label: 'TV' },
  { value: 'MOVIE', label: 'Filme' },
  { value: 'ONA', label: 'ONA' },
  { value: 'OVA', label: 'OVA' },
  { value: 'SPECIAL', label: 'Especial' },
];

const SEASON_CHIPS = [
  { value: '', label: 'Todas' },
  { value: 'SPRING', label: '🌸 Primavera' },
  { value: 'SUMMER', label: '☀️ Verão' },
  { value: 'FALL', label: '🍂 Outono' },
  { value: 'WINTER', label: '❄️ Inverno' },
];

const ORDER_OPTIONS = [
  { value: 'popular', label: 'Mais populares' },
  { value: 'rating', label: 'Melhor Hypômetro' },
  { value: 'recent', label: 'Mais recentes' },
  { value: 'title', label: 'A–Z' },
];

const YEAR_OPTIONS = [
  { value: '', label: 'Qualquer ano' },
  ...Array.from({ length: 6 }, (_, i) => {
    const y = CURRENT_YEAR - i;
    return { value: String(y), label: String(y) };
  }),
];

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === o.value
              ? 'bg-purple-600 text-white'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function AnimeListPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [orderBy, setOrderBy] = useState<'popular' | 'rating' | 'recent' | 'title'>('popular');
  const [status, setStatus] = useState('');
  const [format, setFormat] = useState('');
  const [season, setSeason] = useState('');
  const [seasonYear, setSeasonYear] = useState('');
  const [page, setPage] = useState(1);

  const resetPage = useCallback(() => setPage(1), []);

  const activeFilters = [status, format, season, seasonYear].filter(Boolean).length;

  const { data, isLoading, isError, refetch } = useAnimeList({
    search: debouncedSearch || undefined,
    orderBy,
    status: status || undefined,
    format: format || undefined,
    season: season || undefined,
    seasonYear: seasonYear ? Number(seasonYear) : undefined,
    page,
    limit: 24,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  function clearFilters() {
    setStatus('');
    setFormat('');
    setSeason('');
    setSeasonYear('');
    setSearch('');
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Animes</h1>
          {data && !isLoading && (
            <p className="mt-1 text-sm text-muted-foreground">
              {data.meta.total} resultado{data.meta.total !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="Buscar anime..."
            className="input-base w-48"
          />
          <select
            value={orderBy}
            onChange={(e) => { setOrderBy(e.target.value as 'popular' | 'rating' | 'recent' | 'title'); resetPage(); }}
            className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-purple-500"
          >
            {ORDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filtros em chips */}
      <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
            <ChipGroup options={STATUS_CHIPS} value={status} onChange={(v) => { setStatus(v); resetPage(); }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Formato</span>
            <ChipGroup options={FORMAT_CHIPS} value={format} onChange={(v) => { setFormat(v); resetPage(); }} />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Temporada</span>
            <ChipGroup options={SEASON_CHIPS} value={season} onChange={(v) => { setSeason(v); resetPage(); }} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Ano</span>
            <div className="flex flex-wrap gap-1.5">
              {YEAR_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => { setSeasonYear(o.value); resetPage(); }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    seasonYear === o.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="mb-0.5 rounded-full border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Limpar {activeFilters} filtro{activeFilters > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {isError && (
        <ErrorState message="Não foi possível carregar os animes." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 24 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && search !== debouncedSearch && (
        <p className="text-center text-xs text-muted-foreground">Buscando...</p>
      )}

      {!isLoading && !isError && (!data?.data || data.data.length === 0) && (
        <EmptyState
          title="Nenhum anime encontrado"
          description="Tente ajustar os filtros ou buscar por outro título."
        />
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
                className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-sm text-muted-foreground">{page} / {data.meta.totalPages}</span>
              <button
                disabled={page === data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
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
