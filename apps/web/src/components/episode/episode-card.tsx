import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@anihype/ui';
import type { EpisodeWithAnime } from '@/types/api';

interface EpisodeCardProps {
  episode: EpisodeWithAnime;
  className?: string;
}

function formatAirDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function EpisodeCard({ episode, className }: EpisodeCardProps) {
  return (
    <Link
      href={`/anime/${episode.anime.slug}/ep/${episode.number}`}
      className={cn('card card-hover group flex gap-3 p-3', className)}
    >
      {/* Thumbnail ou cover do anime */}
      <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {(episode.thumbnailUrl ?? episode.anime.coverImageUrl) ? (
          <Image
            src={(episode.thumbnailUrl ?? episode.anime.coverImageUrl)!}
            alt={episode.title ?? `Ep ${episode.number}`}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Ep {episode.number}</span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col justify-center gap-0.5">
        <p className="truncate text-xs text-purple-400 font-medium">
          {episode.anime.titleEnglish ?? episode.anime.titleRomaji}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">
          {episode.title ? episode.title : `Episódio ${episode.number}`}
        </p>
        {episode.airDate && (
          <p className="text-xs text-muted-foreground">{formatAirDate(episode.airDate)}</p>
        )}
      </div>
    </Link>
  );
}

export function EpisodeCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card flex gap-3 p-3', className)}>
      <div className="h-16 w-28 flex-shrink-0 rounded-lg shimmer" />
      <div className="flex flex-1 flex-col justify-center gap-2">
        <div className="h-3 w-1/2 rounded shimmer" />
        <div className="h-4 w-3/4 rounded shimmer" />
      </div>
    </div>
  );
}
