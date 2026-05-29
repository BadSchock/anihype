'use client';

import Link from 'next/link';
import { useUserActivity } from '@/hooks/use-feed';
import { UserAvatar } from '@/components/user/user-avatar';
import { EmptyState } from '@/components/ui/empty-state';
import type { FeedItem } from '@/types/api';

interface Props {
  username: string;
}

function FeedItemCard({ item }: { item: FeedItem }) {
  const name = item.user.displayName ?? item.user.username;

  if (item.type === 'COMMENT' && item.comment) {
    const { anime, number } = item.comment.episode;
    const animeTitle = anime.titleEnglish ?? anime.titleRomaji;
    return (
      <Link
        href={`/anime/${anime.slug}/ep/${number}`}
        className="block rounded-xl border border-border bg-card/50 p-4 transition-colors hover:border-purple-500/30"
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <UserAvatar name={name} avatarUrl={item.user.avatarUrl} size="sm" />
          <span>@{item.user.username}</span>
          <span>· comentou</span>
        </div>
        <p className="line-clamp-2 text-sm text-foreground/90">
          {item.comment.isSpoiler ? '🛡 Spoiler' : item.comment.content}
        </p>
        <p className="mt-2 text-xs font-medium text-purple-400">
          {animeTitle} · Ep {number}
        </p>
      </Link>
    );
  }

  if (item.type === 'RATING' && item.rating) {
    const animeTitle = item.rating.anime.titleEnglish ?? item.rating.anime.titleRomaji;
    return (
      <Link
        href={`/anime/${item.rating.anime.slug}`}
        className="block rounded-xl border border-border bg-card/50 p-4 transition-colors hover:border-purple-500/30"
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <UserAvatar name={name} avatarUrl={item.user.avatarUrl} size="sm" />
          <span>@{item.user.username}</span>
          <span>· avaliou {item.rating.badge.emoji} {item.rating.finalScore.toFixed(1)}</span>
        </div>
        {item.rating.reviewText && (
          <p className="line-clamp-2 text-sm text-foreground/90">
            {item.rating.containsSpoiler ? '🛡 Spoiler' : item.rating.reviewText}
          </p>
        )}
        <p className="mt-2 text-xs font-medium text-purple-400">{animeTitle}</p>
      </Link>
    );
  }

  return null;
}

export function UserActivitySection({ username }: Props) {
  const { data, isLoading } = useUserActivity(username);

  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-bold text-foreground">Atividade recente</h2>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-border shimmer" />
          ))}
        </div>
      )}

      {!isLoading && (!data?.data.length) && (
        <EmptyState
          title="Nenhuma atividade ainda"
          description="Comentários e avaliações aparecerão aqui."
        />
      )}

      {!isLoading && data?.data.length ? (
        <div className="flex flex-col gap-3">
          {data.data.map((item, i) => (
            <FeedItemCard key={`${item.type}-${item.createdAt}-${i}`} item={item} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
