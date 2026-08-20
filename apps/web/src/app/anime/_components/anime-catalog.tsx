'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';
import { useInfiniteAnimeList, useGenres } from '@/hooks/use-anime';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { AnimeCard, AnimeCardSkeleton } from '@/components/anime/anime-card';
import { InfiniteScrollSentinel } from '@/components/anime/clip-safe-grid';
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
  const [urlReady, setUrlReady] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const resetScroll = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const genresFromUrl = parseGenreParam(searchParams.get('genre'));
    setSelectedGenres(genresFromUrl);
    const st = searchParams.get('status');
    const fmt = searchParams.get('format');
    const sea = searchParams.get('season');
    const year = searchParams.get('seasonYear');
    const q = searchParams.get('search');
    const ord = searchParams.get('orderBy');
    if (st) setStatus(st);
    if (fmt) setFormat(fmt);
    if (sea) setSeason(sea);
    if (year) setSeasonYear(year);
    if (q) setSearch(q);
    if (ord === 'popular' || ord === 'rating' || ord === 'recent' || ord === 'title') {
      setOrderBy(ord);
    }
    // Open panel when landing with catalog filters already in the URL
    if (st || fmt || sea || year || genresFromUrl.length > 0) {
      setShowFilters(true);
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
    pathname,
    router,
  ]);

  const genreParam = useMemo(
    () => (selectedGenres.length > 0 ? selectedGenres.join(',') : undefined),
    [selectedGenres],
  );

  const activeFilters =
    [status, format, season, seasonYear].filter(Boolean).length + selectedGenres.length;

  const listFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      orderBy,
      status: status || undefined,
      format: format || undefined,
      season: season || undefined,
      seasonYear: seasonYear ? Number(seasonYear) : undefined,
      genre: genreParam,
    }),
    [debouncedSearch, orderBy, status, format, season, seasonYear, genreParam],
  );

  const { data: genres = [], isLoading: loadingGenres } = useGenres();
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteAnimeList(listFilters, 24);

  const animes = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);
  const total = data?.pages[0]?.meta.total ?? 0;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  function toggleGenre(slug: string) {
    setSelectedGenres((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      return [...prev, slug];
    });
    resetScroll();
  }

  function clearFilters() {
    setStatus('');
    setFormat('');
    setSeason('');
    setSeasonYear('');
    setSelectedGenres([]);
    setSearch('');
    resetScroll();
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-x-hidden sm:gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Animes</h1>
          {!isLoading && total > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {total} resultado{total !== 1 ? 's' : ''}
              {animes.length < total ? ` · mostrando ${animes.length}` : ''}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            className={`relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters || activeFilters > 0
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border bg-muted text-foreground hover:border-primary/30'
            }`}
          >
            <Filter className="h-4 w-4" aria-hidden />
            Filtros
            {activeFilters > 0 && (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] font-bold text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </button>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetScroll();
            }}
            placeholder="Buscar anime..."
            className="input-base w-44 sm:w-48"
          />
          <select
            value={orderBy}
            onChange={(e) => {
              setOrderBy(e.target.value as 'popular' | 'rating' | 'recent' | 'title');
              resetScroll();
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

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          showFilters ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mb-1 flex flex-col gap-3 rounded-xl bg-muted/50 p-4">
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
                    resetScroll();
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
                    resetScroll();
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
                    resetScroll();
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
                        resetScroll();
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
        </div>
      </div>

      {isError && (
        <ErrorState message="Não foi possível carregar os animes." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
          {Array.from({ length: 12 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && search !== debouncedSearch && (
        <p className="text-center text-xs text-muted-foreground">Buscando...</p>
      )}

      {!isLoading && !isError && animes.length === 0 && (
        <EmptyState
          title="Nenhum anime encontrado"
          description="Tente ajustar os filtros ou buscar por outro título."
        />
      )}

      {!isLoading && !isError && animes.length > 0 && (
        <>
          <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
            {animes.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>

          <InfiniteScrollSentinel
            onVisible={loadMore}
            disabled={!hasNextPage || isFetchingNextPage}
          />

          {isFetchingNextPage && (
            <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-[repeat(auto-fit,minmax(12rem,1fr))]">
              {Array.from({ length: 6 }).map((_, i) => (
                <AnimeCardSkeleton key={i} />
              ))}
            </div>
          )}

          {!hasNextPage && !isFetchingNextPage && (
            <p className="pb-4 text-center text-xs text-muted-foreground">Fim da lista</p>
          )}
        </>
      )}
    </div>
  );
}
