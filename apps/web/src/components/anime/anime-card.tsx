import Link from 'next/link';
import Image from 'next/image';
import { Zap } from 'lucide-react';
import { cn } from '@anihype/ui';
import type { AnimeListItem } from '@/types/api';
import { Badge } from '@/components/ui/badge';

const STATUS_LABEL: Record<string, { label: string; variant: 'green' | 'yellow' | 'default' | 'blue' }> = {
  AIRING: { label: 'Em exibição', variant: 'green' },
  FINISHED: { label: 'Finalizado', variant: 'default' },
  NOT_YET_AIRED: { label: 'Em breve', variant: 'yellow' },
  HIATUS: { label: 'Hiato', variant: 'yellow' },
  CANCELLED: { label: 'Cancelado', variant: 'default' },
};

interface AnimeCardProps {
  anime: AnimeListItem;
  className?: string;
}

export function AnimeCard({ anime, className }: AnimeCardProps) {
  const statusInfo = STATUS_LABEL[anime.status] ?? { label: anime.status, variant: 'default' as const };

  return (
    <Link
      href={`/anime/${anime.slug}`}
      className={cn(
        'card card-hover group flex flex-col overflow-hidden',
        className,
      )}
    >
      {/* Cover */}
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
        <div className="absolute bottom-2 left-2">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground leading-snug">
          {anime.titleEnglish ?? anime.titleRomaji}
        </h3>
        <p className="text-xs text-muted-foreground">
          {anime.seasonYear && anime.season
            ? `${anime.season} ${anime.seasonYear}`
            : anime.seasonYear ?? '—'}
          {anime.episodeCount ? ` • ${anime.episodeCount} eps` : ''}
        </p>
        <div className="mt-auto flex items-center gap-2">
          {anime.ratingAverage != null && anime.ratingCount != null && anime.ratingCount >= 1 ? (
            <p
              className="inline-flex items-center gap-1 text-xs font-bold text-primary"
              title={`Hypômetro · ${anime.ratingCount} avaliação(ões)`}
            >
              <Zap className="h-3 w-3" aria-hidden />
              {Number(anime.ratingAverage).toFixed(1)}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function AnimeCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl bg-muted border border-border', className)}>
      <div className="aspect-[2/3] w-full shimmer" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-3/4 rounded shimmer" />
        <div className="h-3 w-1/2 rounded shimmer" />
      </div>
    </div>
  );
}
