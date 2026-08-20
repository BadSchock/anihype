'use client';

import { useState } from 'react';

function SpoilerReview({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="relative">
      <p
        className="text-sm text-foreground/80 transition-all duration-300"
        style={{
          filter: revealed ? 'none' : 'blur(6px)',
          userSelect: revealed ? 'text' : 'none',
        }}
      >
        {text}
      </p>
      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-yellow-500/10 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20"
        >
          <span>⚠️</span>
          <span>Spoiler — clique para revelar</span>
        </button>
      )}
    </div>
  );
}
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAnimeRatings, useMyRating } from '@/hooks/use-ratings';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { CommunityScore } from './community-score';
import { RatingForm } from './rating-form';
import { buildLoginUrl } from '@/lib/auth-url';
import { ErrorState } from '@/components/ui/error-state';
import { EquippedBadgeChip } from '@/components/badges/equipped-badge-chip';

function getBadgeColor(label: string) {
  const map: Record<string, string> = {
    'Obra-Prima': 'text-yellow-400',
    'Excelente': 'text-orange-400',
    'Recomendado': 'text-blue-400',
    'Ok': 'text-green-400',
    'Decepcionante': 'text-muted-foreground',
  };
  return map[label] ?? 'text-foreground';
}

export function AnimeRatingSection({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { isAuthenticated, authReady } = useAuthHydrated();
  const [showForm, setShowForm] = useState(false);

  const { data: ratingsData, isLoading: loadingRatings, isError: ratingsError, refetch: refetchRatings } =
    useAnimeRatings(slug);
  const {
    data: myRating,
    isLoading: loadingMine,
    isError: myRatingError,
    refetch: refetchMyRating,
  } = useMyRating(slug);

  const aggregate = ratingsData?.aggregate;
  const reviews = ratingsData?.reviews ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Avaliações da comunidade</h2>
        {authReady && isAuthenticated && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
          >
            {myRating ? '✏️ Editar avaliação' : '⭐ Avaliar'}
          </button>
        )}
        {authReady && !isAuthenticated && (
          <Link href={buildLoginUrl(pathname)} className="text-sm text-purple-400 hover:underline">
            Faça login para avaliar
          </Link>
        )}
      </div>

      {/* Formulário de avaliação */}
      {showForm && (
        <div className="rounded-xl border border-purple-500/20 bg-muted/50 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {myRating ? 'Editar sua avaliação' : 'Sua avaliação'}
          </h3>
          {!loadingMine && (
            <RatingForm
              slug={slug}
              myRating={myRating ?? null}
              onClose={() => setShowForm(false)}
            />
          )}
        </div>
      )}

      {/* Score da comunidade */}
      {ratingsError && (
        <ErrorState
          message="Não foi possível carregar as avaliações."
          onRetry={() => refetchRatings()}
        />
      )}

      {myRatingError && isAuthenticated && (
        <ErrorState
          message="Não foi possível carregar sua avaliação."
          onRetry={() => refetchMyRating()}
        />
      )}

      {!ratingsError && loadingRatings ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
      ) : !ratingsError && aggregate ? (
        <CommunityScore aggregate={aggregate} />
      ) : null}

      {/* Minha avaliação resumida (quando não está editando) */}
      {!showForm && myRating && (
        <div className="flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-black text-purple-400">{Number(myRating.finalScore).toFixed(1)}</span>
            <div>
              <p className={`text-sm font-semibold ${getBadgeColor(myRating.badge.label)}`}>
                {myRating.badge.emoji} {myRating.badge.label}
              </p>
              <p className="text-xs text-muted-foreground">Sua avaliação</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="text-xs text-purple-400 hover:underline"
          >
            Editar
          </button>
        </div>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Reviews ({ratingsData?.meta.total ?? 0})
          </h3>
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl bg-muted/50 p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {review.user.displayName ?? review.user.username}
                  </span>
                  {review.user.equippedBadge && (
                    <EquippedBadgeChip badge={review.user.equippedBadge} />
                  )}
                  <span className={`text-xs font-medium ${getBadgeColor(review.badge.label)}`}>
                    {review.badge.emoji} {review.badge.label}
                  </span>
                </div>
                <span className="shrink-0 text-lg font-black text-purple-400">
                  {review.finalScore.toFixed(1)}
                </span>
              </div>
              {review.containsSpoiler ? (
                <SpoilerReview text={review.reviewText ?? ''} />
              ) : (
                <p className="text-sm text-foreground/80">{review.reviewText}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
