'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAnimeEpisodes } from '@/hooks/use-episodes';
import { EpisodeCardSkeleton } from '@/components/episode/episode-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import type { EpisodeWithAnime } from '@/types/api';

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'default'> = {
  AIRED: 'green',
  UPCOMING: 'yellow',
  UNKNOWN: 'default',
};

function EpisodeRow({ ep, animeSlug }: { ep: EpisodeWithAnime; animeSlug: string }) {
  return (
    <Link
      href={`/anime/${animeSlug}/ep/${ep.number}`}
      className="group flex items-center gap-4 rounded-xl bg-muted p-3 transition-all hover:bg-muted"
    >
      {/* Thumbnail */}
      <div className="relative h-14 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {(ep.thumbnailUrl ?? ep.anime?.coverImageUrl) && (
          <Image
            src={(ep.thumbnailUrl ?? ep.anime?.coverImageUrl)!}
            alt={ep.title ?? `Ep ${ep.number}`}
            fill
            className="object-cover"
            sizes="96px"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="text-xs font-bold text-foreground">{ep.number}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {ep.title ?? `Episódio ${ep.number}`}
        </p>
        {ep.airDate && (
          <p className="text-xs text-muted-foreground">
            {new Date(ep.airDate).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      <Badge variant={STATUS_COLOR[ep.status] ?? 'default'}>
        {ep.status === 'AIRED' ? 'Assistido' : ep.status === 'UPCOMING' ? 'Em breve' : '—'}
      </Badge>
    </Link>
  );
}

interface Props {
  animeId: number;
  animeSlug: string;
}

export function AnimeEpisodesClient({ animeId, animeSlug }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAnimeEpisodes(animeId, page);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <EpisodeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <EmptyState
        title="Sem episódios"
        description="Os episódios ainda não foram sincronizados para este anime."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {data.data.map((ep) => (
          <EpisodeRow key={ep.id} ep={ep} animeSlug={animeSlug} />
        ))}
      </div>

      {/* Paginação */}
      {data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.meta.totalPages}
          </span>
          <button
            disabled={page === data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}
