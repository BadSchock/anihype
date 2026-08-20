'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAnimeRatings, useMyRating } from '@/hooks/use-ratings';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useAuthStore } from '@/stores/auth.store';
import { CommunityScore } from './community-score';
import { RatingForm } from './rating-form';
import { buildLoginUrl } from '@/lib/auth-url';
import { ErrorState } from '@/components/ui/error-state';
import type { AnimeReview } from '@/types/api';
import { censorText } from '@/lib/censor-text';
import { consumeHypometroFocus, scrollToHypometro } from '@/lib/hypometro-nav';

const EXCERPT_LEN = 500;

type RatingsSort = 'recent' | 'score';

function SpoilerReview({ text }: { text: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="relative">
      <p
        className="text-sm text-foreground/80 transition-all duration-300 whitespace-pre-wrap"
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

function ReviewBody({ text, containsSpoiler }: { text: string; containsSpoiler: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = text.length > EXCERPT_LEN;
  const display =
    !expanded && needsTruncate ? `${text.slice(0, EXCERPT_LEN).trimEnd()}…` : text;

  const content = containsSpoiler ? (
    <SpoilerReview text={display} />
  ) : (
    <p className="text-sm text-foreground/80 whitespace-pre-wrap">{display}</p>
  );

  return (
    <div>
      {content}
      {needsTruncate && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs font-medium text-primary hover:underline"
        >
          {expanded ? 'Mostrar menos' : 'Ler mais'}
        </button>
      )}
    </div>
  );
}

function getBadgeColor(label: string) {
  const map: Record<string, string> = {
    'Obra-Prima': 'text-yellow-400',
    Excelente: 'text-orange-400',
    Recomendado: 'text-blue-400',
    Ok: 'text-green-400',
    Decepcionante: 'text-muted-foreground',
  };
  return map[label] ?? 'text-foreground';
}

function relativeDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  return d.toLocaleDateString('pt-BR');
}

function ReviewCard({
  review,
  highlighted,
}: {
  review: Pick<
    AnimeReview,
    'id' | 'finalScore' | 'reviewText' | 'containsSpoiler' | 'badge' | 'user' | 'createdAt'
  >;
  highlighted?: boolean;
}) {
  const name = review.user.displayName ?? review.user.username;
  const body = review.reviewText ? censorText(review.reviewText) : '';
  return (
    <div
      className={`mx-auto w-full max-w-3xl rounded-xl p-4 ${
        highlighted
          ? 'border border-primary/30 bg-primary/10'
          : 'bg-muted/50'
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={`/u/${review.user.username}`}
            className="truncate text-sm font-semibold text-foreground hover:underline"
          >
            {name}
          </Link>
          <span className={`shrink-0 text-xs font-medium ${getBadgeColor(review.badge.label)}`}>
            {review.badge.emoji} {review.badge.label}
          </span>
          {highlighted && (
            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              Sua review
            </span>
          )}
        </div>
        <span className="shrink-0 text-lg font-black text-primary">
          {Number(review.finalScore).toFixed(1)}
        </span>
      </div>
      {body ? (
        <ReviewBody text={body} containsSpoiler={review.containsSpoiler} />
      ) : null}
      <p className="mt-2 text-xs text-muted-foreground">{relativeDate(review.createdAt)}</p>
    </div>
  );
}

export function AnimeRatingSection({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { isAuthenticated, authReady } = useAuthHydrated();
  const userId = useAuthStore((s) => s.user?.id);
  const username = useAuthStore((s) => s.user?.username);
  const displayName = useAuthStore((s) => s.user?.displayName);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sort, setSort] = useState<RatingsSort>('score');
  const [page, setPage] = useState(1);
  const openFormIntent = useRef(false);
  const shouldScroll = useRef(false);

  const listSort: RatingsSort = expanded ? sort : 'score';
  const listPage = expanded ? page : 1;
  const listLimit = expanded ? 20 : 3;

  const { data: ratingsData, isLoading: loadingRatings, isError: ratingsError, refetch: refetchRatings } =
    useAnimeRatings(slug, { page: listPage, limit: listLimit, sort: listSort });
  const {
    data: myRating,
    isLoading: loadingMine,
    isError: myRatingError,
    refetch: refetchMyRating,
  } = useMyRating(slug);

  // Deep-link from episode CTA (Next App Router often ignores #hash / scrolls to top)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('rate') === '1';
    const fromHash = window.location.hash === '#hypometro';
    const fromStorage = consumeHypometroFocus();

    if (!fromQuery && !fromHash && !fromStorage) return;

    shouldScroll.current = true;
    if (fromQuery) {
      openFormIntent.current = true;
      params.delete('rate');
      const qs = params.toString();
      window.history.replaceState(null, '', `${pathname}${qs ? `?${qs}` : ''}#hypometro`);
    } else if (fromStorage && !fromHash) {
      window.history.replaceState(null, '', `${pathname}${window.location.search}#hypometro`);
    }
  }, [pathname]);

  useEffect(() => {
    if (!shouldScroll.current) return;

    const run = () => {
      scrollToHypometro();
    };

    run();
    const timers = [80, 250, 500, 900, 1400].map((ms) => window.setTimeout(run, ms));
    const stop = window.setTimeout(() => {
      shouldScroll.current = false;
    }, 1600);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(stop);
    };
  }, [pathname, loadingRatings, ratingsData]);

  useEffect(() => {
    if (!authReady || !openFormIntent.current) return;
    if (!isAuthenticated) return;
    setShowForm(true);
    openFormIntent.current = false;
  }, [authReady, isAuthenticated]);

  const aggregate = ratingsData?.aggregate;
  const meta = ratingsData?.meta;

  const communityReviews = useMemo(() => {
    const list = ratingsData?.reviews ?? [];
    if (!userId) return list;
    return list.filter((r) => r.userId !== userId);
  }, [ratingsData?.reviews, userId]);

  const pinnedOwn =
    myRating?.reviewText && username
      ? {
          id: myRating.id,
          finalScore: Number(myRating.finalScore),
          reviewText: myRating.reviewText,
          containsSpoiler: myRating.containsSpoiler,
          badge: myRating.badge,
          user: {
            id: userId ?? 0,
            username,
            displayName,
          },
          createdAt: myRating.createdAt ?? new Date().toISOString(),
        }
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Hypômetro</h2>
          <p className="text-xs text-muted-foreground">Atributos e reviews da comunidade</p>
        </div>
        {authReady && isAuthenticated && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            {myRating ? 'Editar Hypômetro' : 'Avaliar no Hypômetro'}
          </button>
        )}
        {authReady && !isAuthenticated && (
          <Link href={buildLoginUrl(pathname)} className="text-sm font-medium text-primary hover:underline">
            Faça login para avaliar no Hypômetro
          </Link>
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-primary/20 bg-muted/40 p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            {myRating ? 'Editar seu Hypômetro' : 'Seu Hypômetro'}
          </h3>
          {!loadingMine && (
            <RatingForm slug={slug} myRating={myRating ?? null} onClose={() => setShowForm(false)} />
          )}
        </div>
      )}

      {ratingsError && (
        <ErrorState message="Não foi possível carregar o Hypômetro." onRetry={() => refetchRatings()} />
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

      {!showForm && authReady && isAuthenticated && !myRating && !loadingMine && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-4 text-center">
          <p className="text-sm text-foreground">Você ainda não registrou este anime no Hypômetro.</p>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-2 text-sm font-semibold text-primary hover:underline"
          >
            Avaliar no Hypômetro
          </button>
        </div>
      )}

      {!showForm && pinnedOwn && (
        <ReviewCard review={pinnedOwn} highlighted />
      )}

      {(communityReviews.length > 0 || (meta && meta.total > 0)) && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Reviews {meta ? `(${meta.total})` : ''}
            </h3>
            {expanded && (
              <div className="flex gap-1 rounded-lg bg-muted p-0.5">
                {(
                  [
                    { key: 'score' as const, label: 'Melhor nota' },
                    { key: 'recent' as const, label: 'Mais recentes' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSort(opt.key);
                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      sort === opt.key
                        ? 'bg-purple-600 text-white'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {communityReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}

          {!expanded && (meta?.total ?? 0) > 3 && (
            <button
              type="button"
              onClick={() => {
                setExpanded(true);
                setSort('score');
                setPage(1);
              }}
              className="rounded-xl border border-purple-500/20 py-2.5 text-sm font-medium text-purple-400 transition-colors hover:bg-purple-500/10"
            >
              Ver todas as reviews
            </button>
          )}

          {expanded && meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-xs text-muted-foreground">
                Página {meta.page} de {meta.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium text-foreground disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
