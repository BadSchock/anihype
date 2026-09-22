'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getHeroHighlight } from '@/services/api';

function DefaultHero() {
  return (
    <section className="relative -mx-4 -mt-6 overflow-hidden sm:-mx-6">
      <div className="relative bg-gradient-to-br from-purple-100/80 via-background to-background dark:from-purple-900/40 dark:via-background">
        <div className="relative mx-auto min-h-[14.5rem] max-w-6xl sm:min-h-[22rem] lg:min-h-[23.5rem]">
          <div className="relative z-10 px-4 pb-4 pt-8 text-left sm:max-w-xl sm:px-6 sm:pb-14 sm:pt-14 lg:max-w-2xl lg:pt-16">
            <h1 className="text-[clamp(1.7rem,7.6vw,2.25rem)] font-extrabold leading-[1.12] tracking-tight text-foreground sm:text-5xl sm:leading-none">
              <span className="block sm:inline">Viva o hype da</span>{' '}
              <span className="text-gradient">temporada</span>
            </h1>
            <p className="mt-3 max-w-[65%] text-base leading-snug text-muted-foreground sm:mt-4 sm:max-w-none sm:text-lg sm:leading-normal">
              Acompanhe lançamentos, discuta episódios e conecte-se com a comunidade brasileira de anime.
            </p>
          </div>

          {/*
            O PNG é 2000×2000 com a personagem no miolo (~55% da altura).
            A caixa é maior que o Hero e deslocada para baixo/direita para
            a base encostar no chão e a margem transparente sair do quadro.
          */}
          <div className="pointer-events-none absolute -bottom-[6.4rem] -right-28 h-[21.16rem] w-[21.16rem] sm:-bottom-[8.14rem] sm:-right-10 sm:h-[36rem] sm:w-[36rem]">
            <Image
              src="/mascote-anihype.png"
              alt="Mascote do AniHype"
              fill
              priority
              sizes="(max-width: 639px) 340px, 576px"
              className="object-contain"
            />
          </div>
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
              <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                <Zap className="h-4 w-4" aria-hidden />
                Hypômetro {highlight.anime.ratingAverage.toFixed(1)}
                <span className="font-medium text-muted-foreground">
                  · {highlight.anime.ratingCount} avaliações
                </span>
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
