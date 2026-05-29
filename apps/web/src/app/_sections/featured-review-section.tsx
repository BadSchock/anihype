'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { getFeaturedReview } from '@/services/api';
import { UserAvatar } from '@/components/user/user-avatar';

export function FeaturedReviewSection() {
  const { data: review, isLoading } = useQuery({
    queryKey: ['ratings', 'featured'],
    queryFn: getFeaturedReview,
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading || !review?.reviewText) return null;

  const animeTitle = review.anime.titleEnglish ?? review.anime.titleRomaji;
  const userName = review.user.displayName ?? review.user.username;

  return (
    <section className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/5 to-transparent p-5 sm:p-6">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-400">
        Review em destaque
      </p>
      <Link
        href={`/anime/${review.anime.slug}`}
        className="group flex flex-col gap-4 sm:flex-row sm:items-start"
      >
        {review.anime.coverImageUrl && (
          <div className="relative mx-auto h-36 w-24 flex-shrink-0 overflow-hidden rounded-lg shadow-lg sm:mx-0">
            <Image
              src={review.anime.coverImageUrl}
              alt={animeTitle}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="96px"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold text-foreground group-hover:text-purple-300">
              {animeTitle}
            </span>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
              {review.badge.emoji} {review.finalScore.toFixed(1)}
            </span>
          </div>
          <p className="line-clamp-4 text-sm leading-relaxed text-foreground/85">
            {review.containsSpoiler ? '🛡 Review com spoiler — leia na página do anime' : review.reviewText}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <UserAvatar name={userName} avatarUrl={review.user.avatarUrl} size="sm" />
            <span>@{review.user.username}</span>
          </div>
        </div>
      </Link>
    </section>
  );
}
