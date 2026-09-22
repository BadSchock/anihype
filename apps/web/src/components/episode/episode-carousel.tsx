'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@anihype/ui';
import type { EpisodeWithAnime } from '@/types/api';
import { formatAirTimeBrt, getEpisodeAiredAt } from '@/lib/date-brt';

export function EpisodeGridCard({ episode }: { episode: EpisodeWithAnime }) {
  const cover = episode.thumbnailUrl ?? episode.anime.coverImageUrl;
  const airedAt = getEpisodeAiredAt(episode);

  return (
    <Link
      href={`/anime/${episode.anime.slug}/ep/${episode.number}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20"
    >
      {/* Imagem — proporção 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {cover ? (
          <Image
            src={cover}
            alt={episode.anime.titleEnglish ?? episode.anime.titleRomaji}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-muted">
            <span className="text-2xl font-black text-purple-400/50">{episode.number}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          EP {episode.number}
        </div>
        {airedAt && (
          <div className="absolute bottom-2 right-2 rounded-md bg-purple-600/80 px-1.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {formatAirTimeBrt(airedAt)}
          </div>
        )}
      </div>
      <div className="flex min-h-[2.5rem] flex-col gap-0.5 p-3">
        <p
          className="line-clamp-2 text-[11px] font-semibold leading-snug text-purple-400"
          title={episode.anime.titleEnglish ?? episode.anime.titleRomaji}
        >
          {episode.anime.titleEnglish ?? episode.anime.titleRomaji}
        </p>
        <p className="line-clamp-1 text-xs font-medium text-foreground">
          {episode.title ? episode.title : `Episódio ${episode.number}`}
        </p>
      </div>
    </Link>
  );
}

export function EpisodeGridCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="aspect-video w-full shimmer" />
      <div className="flex flex-col gap-1.5 p-3">
        <div className="h-3 w-2/3 rounded shimmer" />
        <div className="h-3 w-4/5 rounded shimmer" />
      </div>
    </div>
  );
}

function EpisodeCarouselCard({
  episode,
  renderBadge,
}: {
  episode: EpisodeWithAnime;
  renderBadge?: (episode: EpisodeWithAnime) => React.ReactNode;
}) {
  const cover = episode.thumbnailUrl ?? episode.anime.coverImageUrl;
  const airedAt = getEpisodeAiredAt(episode);

  return (
    <Link
      href={`/anime/${episode.anime.slug}/ep/${episode.number}`}
      className="group relative flex w-[min(78vw,18rem)] flex-shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-900/20 hover:-translate-y-0.5 sm:w-52"
    >
      {/* Imagem */}
      <div className="relative h-52 w-full overflow-hidden bg-muted sm:h-52">
        {cover ? (
          <Image
            src={cover}
            alt={episode.anime.titleEnglish ?? episode.anime.titleRomaji}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="208px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/40 to-muted">
            <span className="text-2xl font-black text-purple-400/50">{episode.number}</span>
          </div>
        )}

        {/* Gradiente sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {renderBadge?.(episode)}

        {/* Badge de episódio */}
        <div className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-sm">
          EP {episode.number}
        </div>

        {/* Horário */}
        {airedAt && (
          <div className="absolute bottom-2 right-2 rounded-md bg-purple-600/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
            {formatAirTimeBrt(airedAt)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex min-h-[2.5rem] flex-col gap-1 p-3">
        <p
          className="line-clamp-2 text-sm font-semibold leading-snug text-purple-400 sm:text-xs"
          title={episode.anime.titleEnglish ?? episode.anime.titleRomaji}
        >
          {episode.anime.titleEnglish ?? episode.anime.titleRomaji}
        </p>
        <p className="line-clamp-2 text-base font-medium leading-snug text-foreground sm:line-clamp-1 sm:text-sm">
          {episode.title ? episode.title : `Episódio ${episode.number}`}
        </p>
      </div>
    </Link>
  );
}

export function EpisodeCarouselSkeleton() {
  return (
    <div className="flex w-[min(78vw,18rem)] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card sm:w-52">
      <div className="h-52 w-full shimmer" />
      <div className="flex flex-col gap-1.5 p-3">
        <div className="h-3 w-2/3 rounded shimmer" />
        <div className="h-3 w-4/5 rounded shimmer" />
      </div>
    </div>
  );
}

interface EpisodeCarouselProps {
  episodes: EpisodeWithAnime[];
  className?: string;
  renderBadge?: (episode: EpisodeWithAnime) => React.ReactNode;
}

export function EpisodeCarousel({ episodes, className, renderBadge }: EpisodeCarouselProps) {
  return (
    <div
      className={cn(
        'flex w-full min-w-0 max-w-full snap-x snap-mandatory gap-3 overflow-x-auto pb-3',
        // Esconde a scrollbar mas mantém funcional
        '[&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-500/30',
        className,
      )}
    >
      {episodes.map((ep) => (
        <EpisodeCarouselCard key={ep.id} episode={ep} renderBadge={renderBadge} />
      ))}
    </div>
  );
}
