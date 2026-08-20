'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useMyRating } from '@/hooks/use-ratings';
import { buildLoginUrl } from '@/lib/auth-url';
import { markHypometroFocus } from '@/lib/hypometro-nav';

interface Props {
  slug: string;
  animeTitle: string;
}

export function EpisodeHypometerCta({ slug, animeTitle }: Props) {
  const { isAuthenticated, authReady } = useAuthHydrated();
  const { data: myRating, isLoading } = useMyRating(slug);

  const hypometroHref = `/anime/${slug}?rate=1#hypometro`;
  const loginHref = buildLoginUrl(hypometroHref);

  function handleGoToHypometro() {
    markHypometroFocus();
  }

  return (
    <div className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-background to-muted/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            Hypômetro
          </p>
          <p className="text-sm font-semibold text-foreground">
            {myRating
              ? `Sua nota em ${animeTitle}: ${Number(myRating.finalScore).toFixed(1)}`
              : `Avalie ${animeTitle} no Hypômetro`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            A nota é do anime inteiro — anima a comunidade depois do episódio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!authReady || isLoading ? (
            <div className="h-9 w-36 animate-pulse rounded-lg bg-muted" aria-hidden />
          ) : isAuthenticated ? (
            <Link
              href={hypometroHref}
              scroll={false}
              onClick={handleGoToHypometro}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              {myRating ? 'Editar Hypômetro' : 'Avaliar no Hypômetro'}
            </Link>
          ) : (
            <Link
              href={loginHref}
              onClick={handleGoToHypometro}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Entrar para avaliar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
