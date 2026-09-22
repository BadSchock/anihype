'use client';

import Link from 'next/link';
import { useTrendingEpisodes, useHotComments } from '@/hooks/use-episodes';
import { EpisodeCarousel, EpisodeCarouselSkeleton } from '@/components/episode/episode-carousel';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { UserAvatar } from '@/components/user/user-avatar';
import { EquippedBadgeChip } from '@/components/badges/equipped-badge-chip';
import type { TrendingEpisode } from '@/types/api';

export function CommunitySection() {
  const trending = useTrendingEpisodes(7, 10);
  const hotComments = useHotComments(6, 7);

  const hasTrending = trending.data && trending.data.length > 0;
  const hasHot = hotComments.data && hotComments.data.length > 0;
  const showSection =
    trending.isLoading ||
    hotComments.isLoading ||
    hasTrending ||
    hasHot ||
    trending.isError ||
    hotComments.isError;

  if (!showSection) return null;

  return (
    <section className="rounded-2xl border border-purple-500/15 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent p-5 sm:p-6">
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          <h2 className="text-2xl font-bold text-foreground sm:text-xl">Comunidade em alta</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Onde a galera está comentando e reagindo esta semana.
        </p>
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <h3 className="mb-3 text-base font-semibold text-purple-300 sm:text-sm">Episódios em discussão</h3>

          {trending.isError && (
            <ErrorState message="Não foi possível carregar episódios em alta." onRetry={() => trending.refetch()} />
          )}

          {trending.isLoading && (
            <div className="flex w-full min-w-0 gap-3 overflow-x-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <EpisodeCarouselSkeleton key={i} />
              ))}
            </div>
          )}

          {!trending.isLoading && !trending.isError && !hasTrending && (
            <EmptyState
              title="Ainda quieto por aqui"
              description="Comente nos episódios da semana para aparecerem aqui."
            />
          )}

          {!trending.isLoading && !trending.isError && hasTrending && (
            <EpisodeCarousel
              episodes={trending.data!}
              renderBadge={(ep) => {
                const trendingEp = ep as TrendingEpisode;
                if (trendingEp.recentCommentCount > 0) {
                  return (
                    <div className="absolute top-2 right-2 rounded-md bg-purple-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      💬 {trendingEp.recentCommentCount}
                    </div>
                  );
                }
                return null;
              }}
            />
          )}
        </div>

        <div className="min-w-0 lg:col-span-2">
          <h3 className="mb-3 text-base font-semibold text-purple-300 sm:text-sm">Comentários em destaque</h3>

          {hotComments.isError && (
            <ErrorState message="Não foi possível carregar comentários." onRetry={() => hotComments.refetch()} />
          )}

          {hotComments.isLoading && (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl border border-border shimmer" />
              ))}
            </div>
          )}

          {!hotComments.isLoading && !hotComments.isError && !hasHot && (
            <p className="text-sm text-muted-foreground">Nenhum comentário em destaque ainda.</p>
          )}

          {!hotComments.isLoading && !hotComments.isError && hasHot && (
            <div className="flex flex-col gap-3">
              {hotComments.data!.map((comment) => {
                const animeTitle =
                  comment.episode.anime.titleEnglish ?? comment.episode.anime.titleRomaji;
                const href = `/anime/${comment.episode.anime.slug}/ep/${comment.episode.number}`;

                return (
                  <Link
                    key={comment.id}
                    href={href}
                    className="group rounded-xl border border-border bg-card/60 p-3 transition-colors hover:border-purple-500/40 hover:bg-card"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <UserAvatar
                        name={comment.author.username}
                        avatarUrl={comment.author.avatarUrl}
                        size="sm"
                      />
                      <span className="text-sm font-medium text-foreground sm:text-xs">
                        @{comment.author.username}
                      </span>
                      {comment.author.equippedBadge && (
                        <EquippedBadgeChip badge={comment.author.equippedBadge} />
                      )}
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        {comment.likeCount > 0 && `❤ ${comment.likeCount}`}
                        {comment.replyCount > 0 && ` · ${comment.replyCount} resp.`}
                      </span>
                    </div>
                    <p className="line-clamp-3 text-base leading-snug text-foreground/85 group-hover:text-foreground sm:line-clamp-2 sm:text-sm">
                      {comment.isSpoiler ? '🛡 Spoiler — toque para ver na página' : comment.content}
                    </p>
                    <p className="mt-2 text-sm font-medium text-purple-400 sm:text-xs">
                      {animeTitle} · Ep {comment.episode.number}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
