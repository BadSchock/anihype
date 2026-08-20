'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAnimeList, useGenres } from '@/hooks/use-anime';
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

function parseGenreParam(raw: string | null): string[] {
  if (!raw?.trim()) return [];
  return [
    ...new Set(
      raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

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
          key={o.value || 'all'}
          type="button"
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

export function AnimeCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [orderBy, setOrderBy] = useState<'popular' | 'rating' | 'recent' | 'title'>('popular');
  const [status, setStatus] = useState('');
  const [format, setFormat] = useState('');
  const [season, setSeason] = useState('');
  const [seasonYear, setSeasonYear] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [urlReady, setUrlReady] = useState(false);

  const resetPage = useCallback(() => setPage(1), []);

  useEffect(() => {
    setSelectedGenres(parseGenreParam(searchParams.get('genre')));
    const st = searchParams.get('status');
    const fmt = searchParams.get('format');
    const sea = searchParams.get('season');
    const year = searchParams.get('seasonYear');
    const q = searchParams.get('search');
    const ord = searchParams.get('orderBy');
    const p = searchParams.get('page');
    if (st) setStatus(st);
    if (fmt) setFormat(fmt);
    if (sea) setSeason(sea);
    if (year) setSeasonYear(year);
    if (q) setSearch(q);
    if (ord === 'popular' || ord === 'rating' || ord === 'recent' || ord === 'title') {
      setOrderBy(ord);
    }
    if (p) {
      const n = parseInt(p, 10);
      if (!Number.isNaN(n) && n >= 1) setPage(n);
    }
    setUrlReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial URL hydrate only
  }, []);

  useEffect(() => {
    if (!urlReady) return;
    const params = new URLSearchParams();
    if (selectedGenres.length > 0) params.set('genre', selectedGenres.join(','));
    if (status) params.set('status', status);
    if (format) params.set('format', format);
    if (season) params.set('season', season);
    if (seasonYear) params.set('seasonYear', seasonYear);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (orderBy !== 'popular') params.set('orderBy', orderBy);
    if (page > 1) params.set('page', String(page));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    urlReady,
    selectedGenres,
    status,
    format,
    season,
    seasonYear,
    debouncedSearch,
    orderBy,
    page,
    pathname,
    router,
  ]);

  const genreParam = useMemo(
    () => (selectedGenres.length > 0 ? selectedGenres.join(',') : undefined),
    [selectedGenres],
  );

  const activeFilters =
    [status, format, season, seasonYear].filter(Boolean).length + selectedGenres.length;

  const { data: genres = [], isLoading: loadingGenres } = useGenres();
  const { data, isLoading, isError, refetch } = useAnimeList({
    search: debouncedSearch || undefined,
    orderBy,
    status: status || undefined,
    format: format || undefined,
    season: season || undefined,
    seasonYear: seasonYear ? Number(seasonYear) : undefined,
    genre: genreParam,
    page,
    limit: 24,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  function toggleGenre(slug: string) {
    setSelectedGenres((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      return [...prev, slug];
    });
    resetPage();
  }

  function clearFilters() {
    setStatus('');
    setFormat('');
    setSeason('');
    setSeasonYear('');
    setSelectedGenres([]);
    setSearch('');
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-6">
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
            onChange={(e) => {
              setOrderBy(e.target.value as 'popular' | 'rating' | 'recent' | 'title');
              resetPage();
            }}
            className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-purple-500"
          >
            {ORDER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </span>
            <ChipGroup
              options={STATUS_CHIPS}
              value={status}
              onChange={(v) => {
                setStatus(v);
                resetPage();
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Formato
            </span>
            <ChipGroup
              options={FORMAT_CHIPS}
              value={format}
              onChange={(v) => {
                setFormat(v);
                resetPage();
              }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Temporada
            </span>
            <ChipGroup
              options={SEASON_CHIPS}
              value={season}
              onChange={(v) => {
                setSeason(v);
                resetPage();
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Ano
            </span>
            <div className="flex flex-wrap gap-1.5">
              {YEAR_OPTIONS.map((o) => (
                <button
                  key={o.value || 'any-year'}
                  type="button"
                  onClick={() => {
                    setSeasonYear(o.value);
                    resetPage();
                  }}
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
              type="button"
              onClick={clearFilters}
              className="mb-0.5 rounded-full border border-red-500/30 px-3 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/10"
            >
              Limpar {activeFilters} filtro{activeFilters > 1 ? 's' : ''}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5 border-t border-border/60 pt-3">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Gênero
            {selectedGenres.length > 1 ? (
              <span className="ml-1 font-normal normal-case text-muted-foreground/80">
                (AND — precisa ter todos)
              </span>
            ) : null}
          </span>
          {loadingGenres ? (
            <div className="h-8 animate-pulse rounded-lg bg-muted" />
          ) : (
            <div className="max-h-28 overflow-y-auto">
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => {
                  const active = selectedGenres.includes(g.slug);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGenre(g.slug)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {g.name}
                    </button>
                  );
                })}
                {genres.length === 0 && (
                  <span className="text-xs text-muted-foreground">
                    Nenhum gênero sincronizado ainda.
                  </span>
                )}
              </div>
            </div>
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
            {data.data.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-30"
              >
                ← Anterior
              </button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.meta.totalPages}
              </span>
              <button
                type="button"
                disabled={page === data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted disabled:opacity-30"
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
