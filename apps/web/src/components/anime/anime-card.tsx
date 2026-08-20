import Link from 'next/link';
import Image from 'next/image';
import { Zap } from 'lucide-react';
import { cn } from '@anihype/ui';
import type { AnimeListItem } from '@/types/api';

const SEASON_PT: Record<string, string> = {
  WINTER: 'Inverno',
  SPRING: 'Primavera',
  SUMMER: 'Verão',
  FALL: 'Outono',
};

const STATUS_STYLE: Record<
  string,
  { label: string; className: string }
> = {
  AIRING: {
    label: 'Em exibição',
    className: 'bg-green-500/15 text-green-400',
  },
  NOT_YET_AIRED: {
    label: 'Em breve',
    className: 'bg-orange-500/15 text-orange-400',
  },
  FINISHED: {
    label: 'Finalizado',
    className: 'bg-gray-500/20 text-gray-400',
  },
  HIATUS: {
    label: 'Hiato',
    className: 'bg-amber-500/15 text-amber-400',
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-red-500/15 text-red-400',
  },
};

interface AnimeCardProps {
  anime: AnimeListItem;
  className?: string;
}

export function AnimeCard({ anime, className }: AnimeCardProps) {
  const status =
    STATUS_STYLE[anime.status] ?? {
      label: anime.status,
      className: 'bg-muted text-muted-foreground',
    };

  const seasonLabel =
    anime.seasonYear && anime.season
      ? `${SEASON_PT[anime.season] ?? anime.season} ${anime.seasonYear}`
      : anime.seasonYear
        ? String(anime.seasonYear)
        : null;

  const hasHypometro =
    anime.ratingAverage != null && anime.ratingCount != null && anime.ratingCount >= 1;

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className={cn(
        'card card-hover group flex min-w-0 w-full flex-col overflow-hidden',
        className,
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        {anime.coverImageUrl ? (
          <Image
            src={anime.coverImageUrl}
            alt={anime.titleEnglish ?? anime.titleRomaji}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">Sem imagem</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span
          className={cn(
            'w-fit rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-wide',
            status.className,
          )}
        >
          {status.label}
        </span>

        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
          {anime.titleEnglish ?? anime.titleRomaji}
        </h3>

        <p className="text-xs text-muted-foreground">
          {seasonLabel ?? '—'}
          {anime.episodeCount ? ` · ${anime.episodeCount} eps` : ''}
        </p>

        <div className="mt-auto pt-0.5">
          {hasHypometro ? (
            <p
              className="inline-flex items-center gap-1 text-xs font-bold text-primary"
              title={`Hypômetro · ${anime.ratingCount} avaliação(ões)`}
            >
              <Zap className="h-3 w-3" aria-hidden />
              {Number(anime.ratingAverage).toFixed(1)}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground/70">Sem Hypômetro</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function AnimeCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border bg-muted',
        className,
      )}
    >
      <div className="aspect-[2/3] w-full shimmer" />
      <div className="flex flex-col gap-1.5 p-3">
        <div className="h-5 w-20 rounded-full shimmer" />
        <div className="h-4 w-3/4 rounded shimmer" />
        <div className="h-3 w-1/2 rounded shimmer" />
        <div className="mt-auto h-3 w-12 rounded shimmer" />
      </div>
    </div>
  );
}
