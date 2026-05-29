'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { getHeroHighlight } from '@/services/api';

function DefaultHero() {
  return (
    <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6">
      <div className="bg-gradient-to-br from-purple-100/80 via-background to-background px-4 py-14 dark:from-purple-900/40 dark:via-background sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Viva o hype da <span className="text-gradient">temporada</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Acompanhe lançamentos, discuta episódios e conecte-se com a comunidade brasileira de anime.
          </p>
        </div>
      </div>
    </section>
  );
}

export function HeroSection() {
  const { data: highlight, isLoading } = useQuery({
    queryKey: ['highlights', 'hero'],
    queryFn: getHeroHighlight,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="relative -mx-4 -mt-6 h-64 animate-pulse overflow-hidden bg-muted sm:-mx-6 sm:h-80" />
    );
  }

  if (!highlight) {
    return <DefaultHero />;
  }

  const image = highlight.imageUrl ?? highlight.anime.bannerImageUrl ?? highlight.anime.coverImageUrl;
  const href = highlight.destination ?? `/anime/${highlight.anime.slug}`;
  const title = highlight.title ?? highlight.anime.titleEnglish ?? highlight.anime.titleRomaji;
  const cta = highlight.ctaLabel ?? 'Ver anime';

  return (
    <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6">
      <div className="relative min-h-[280px] sm:min-h-[360px]">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            priority
            className="object-cover object-top"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/60 to-background" />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />

        <div className="relative mx-auto flex h-full min-h-[280px] max-w-7xl flex-col justify-end px-4 py-10 sm:min-h-[360px] sm:px-6 sm:py-14">
          <div className="max-w-xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-purple-400">
              Destaque da temporada
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-foreground sm:text-5xl">{title}</h1>
            {highlight.subtitle && (
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground sm:text-base">
                {highlight.subtitle}
              </p>
            )}
            {highlight.anime.ratingAverage !== null && highlight.anime.ratingCount >= 10 && (
              <p className="mt-3 text-sm font-semibold text-purple-400">
                ⚡ {highlight.anime.ratingAverage.toFixed(1)} · {highlight.anime.ratingCount} avaliações
              </p>
            )}
            <Link
              href={href}
              className="mt-6 inline-flex rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-700"
            >
              {cta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
