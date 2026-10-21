'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@anihype/ui';
import { useTodayReleases } from '@/hooks/use-episodes';
import { EpisodeCarouselSkeleton } from '@/components/episode/episode-carousel';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { formatAirTimeBrt, getEpisodeAiredAt, getEpisodeTiming } from '@/lib/date-brt';
import type { EpisodeWithAnime } from '@/types/api';

interface TodayGroup {
  slug: string;
  title: string;
  cover: string | null;
  episodes: EpisodeWithAnime[];
}

function groupTodayReleases(episodes: EpisodeWithAnime[]): TodayGroup[] {
  const byAnime = new Map<number, EpisodeWithAnime[]>();

  for (const episode of episodes) {
    const current = byAnime.get(episode.anime.id) ?? [];
    current.push(episode);
    byAnime.set(episode.anime.id, current);
  }

  return [...byAnime.values()]
    .map((list) => {
      const episodesSorted = [...list].sort((a, b) => a.number - b.number);
      const first = episodesSorted[0]!;
      return {
        slug: first.anime.slug,
        title: first.anime.titleEnglish ?? first.anime.titleRomaji,
        cover: first.anime.coverImageUrl ?? first.thumbnailUrl ?? null,
        episodes: episodesSorted,
      };
    })
    .sort((a, b) => {
      const aTime = new Date(getEpisodeAiredAt(a.episodes[0]!) ?? 0).getTime();
      const bTime = new Date(getEpisodeAiredAt(b.episodes[0]!) ?? 0).getTime();
      return aTime - bTime;
    });
}

function releaseLabel(episodes: EpisodeWithAnime[]): string {
  const first = episodes[0]!.number;
  const last = episodes[episodes.length - 1]!.number;
  const allAired = episodes.every((episode) => getEpisodeTiming(episode) !== 'upcoming');

  if (first === last) {
    return allAired ? `Lançou o episódio ${first}` : `Episódio ${first}`;
  }

  return allAired
    ? `Lançou do episódio ${first} ao episódio ${last}`
    : `Episódios ${first} ao ${last}`;
}

function TodayReleaseCard({ group }: { group: TodayGroup }) {
  const first = group.episodes[0]!;
  const last = group.episodes[group.episodes.length - 1]!;
  const airedAt = getEpisodeAiredAt(first);
  const episodeBadge = first.number === last.number ? `EP ${first.number}` : `EP ${first.number}–${last.number}`;

  return (
    <Link
      href={`/anime/${group.slug}#episodios`}
      className="group relative flex w-44 flex-shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20 sm:w-52"
    >
      <div className="relative h-44 w-full overflow-hidden bg-muted sm:h-52">
        {group.cover ? (
          <Image
            src={group.cover}
            alt={group.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="208px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-muted">
            <span className="text-2xl font-black text-purple-400/50">{first.number}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          {episodeBadge}
        </div>
        {airedAt && (
          <div className="absolute bottom-2 right-2 rounded-md bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {formatAirTimeBrt(airedAt)}
          </div>
        )}
      </div>
      <div className="flex min-h-[2.5rem] flex-col gap-0.5 p-3">
        <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-purple-400" title={group.title}>
          {group.title}
        </p>
        <p className="line-clamp-2 text-xs font-medium text-foreground">{releaseLabel(group.episodes)}</p>
      </div>
    </Link>
  );
}

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
        <div
          className={cn(
            'flex gap-3 overflow-x-auto pb-3',
            '[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-500/30',
          )}
        >
          {groupTodayReleases(episodes).map((group) => (
            <TodayReleaseCard key={group.slug} group={group} />
          ))}
        </div>
      )}
    </section>
  );
}
