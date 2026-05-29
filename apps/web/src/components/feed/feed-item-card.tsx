'use client';

import Link from 'next/link';
import { UserAvatar } from '@/components/user/user-avatar';
import type { FeedItem } from '@/types/api';

export function FeedItemCard({ item }: { item: FeedItem }) {
  const name = item.user.displayName ?? item.user.username;

  if (item.type === 'ANIME_FOLLOW' && item.animeFollow) {
    const animeTitle =
      item.animeFollow.anime.titleEnglish ?? item.animeFollow.anime.titleRomaji;
    return (
      <Link
        href={`/anime/${item.animeFollow.anime.slug}`}
        className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-purple-500/30"
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <UserAvatar name={name} avatarUrl={item.user.avatarUrl} size="sm" />
          <span>@{item.user.username}</span>
          <span>· começou a seguir</span>
        </div>
        <p className="text-sm font-medium text-foreground">{animeTitle}</p>
      </Link>
    );
  }

  if (item.type === 'COMMENT' && item.comment) {
    const { anime, number } = item.comment.episode;
    const animeTitle = anime.titleEnglish ?? anime.titleRomaji;
    return (
      <Link
        href={`/anime/${anime.slug}/ep/${number}`}
        className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-purple-500/30"
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <UserAvatar name={name} avatarUrl={item.user.avatarUrl} size="sm" />
          <span>@{item.user.username}</span>
          <span>· comentou em Ep {number}</span>
        </div>
        <p className="line-clamp-3 text-sm text-foreground/90">
          {item.comment.isSpoiler ? '🛡 Spoiler — ver na página' : item.comment.content}
        </p>
        <p className="mt-2 text-xs font-medium text-purple-400">{animeTitle}</p>
      </Link>
    );
  }

  if (item.type === 'RATING' && item.rating) {
    const animeTitle = item.rating.anime.titleEnglish ?? item.rating.anime.titleRomaji;
    return (
      <Link
        href={`/anime/${item.rating.anime.slug}`}
        className="block rounded-xl border border-border bg-card p-4 transition-colors hover:border-purple-500/30"
      >
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <UserAvatar name={name} avatarUrl={item.user.avatarUrl} size="sm" />
          <span>@{item.user.username}</span>
          <span>
            · {item.rating.badge.emoji} {item.rating.finalScore.toFixed(1)} — {item.rating.badge.label}
          </span>
        </div>
        {item.rating.reviewText ? (
          <p className="line-clamp-3 text-sm text-foreground/90">
            {item.rating.containsSpoiler ? '🛡 Spoiler' : item.rating.reviewText}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Avaliou {animeTitle}</p>
        )}
      </Link>
    );
  }

  return null;
}
