import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Zap } from 'lucide-react';
import { getAnimeBySlug } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { AnimeEpisodesClient } from './_components/anime-episodes-client';
import { AnimeRatingSection } from '@/components/ratings/anime-rating-section';
import { TrailerEmbed } from '@/components/anime/trailer-embed';
import { FollowAnimeButton } from '@/components/anime/follow-anime-button';
import { WhereToWatch } from '@/components/anime/where-to-watch';
import { AnimeScheduleBanner } from '@/components/anime/anime-schedule-banner';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const anime = await getAnimeBySlug(slug);
    return {
      title: anime.titleEnglish ?? anime.titleRomaji,
      description: anime.synopsis?.slice(0, 160) ?? undefined,
      openGraph: {
        images: anime.bannerImageUrl ?? anime.coverImageUrl ?? undefined,
      },
    };
  } catch {
    return { title: 'Anime não encontrado' };
  }
}

const STATUS_LABEL: Record<string, string> = {
  AIRING: 'Em exibição',
  FINISHED: 'Finalizado',
  NOT_YET_AIRED: 'Em breve',
  HIATUS: 'Hiato',
  CANCELLED: 'Cancelado',
};

const FORMAT_LABEL: Record<string, string> = {
  TV: 'TV',
  MOVIE: 'Filme',
  OVA: 'OVA',
  ONA: 'ONA',
  SPECIAL: 'Especial',
  MUSIC: 'Música',
};

const SEASON_LABEL: Record<string, string> = {
  WINTER: 'Inverno',
  SPRING: 'Primavera',
  SUMMER: 'Verão',
  FALL: 'Outono',
};

export default async function AnimePage({ params }: Props) {
  const { slug } = await params;

  let anime;
  try {
    anime = await getAnimeBySlug(slug);
  } catch {
    notFound();
  }

  const mainStudio = anime.studios.find((s) => s.role === 'main') ?? anime.studios[0];

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      {/* Banner */}
      <div className="relative h-48 w-full overflow-hidden sm:h-72">
        {anime.bannerImageUrl ? (
          <Image
            src={anime.bannerImageUrl}
            alt={anime.titleRomaji}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-purple-200/60 to-background dark:from-purple-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      </div>

      {/* Conteúdo principal */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:gap-8 -mt-16 sm:-mt-24">
          {/* Cover */}
          <div className="relative mx-auto h-44 w-32 flex-shrink-0 overflow-hidden rounded-xl shadow-2xl sm:mx-0 sm:h-56 sm:w-40">
            {anime.coverImageUrl ? (
              <Image
                src={anime.coverImageUrl}
                alt={anime.titleEnglish ?? anime.titleRomaji}
                fill
                className="object-cover"
                sizes="160px"
                priority
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={
                  anime.status === 'AIRING' ? 'green' :
                  anime.status === 'NOT_YET_AIRED' ? 'yellow' : 'default'
                }
              >
                {STATUS_LABEL[anime.status] ?? anime.status}
              </Badge>
              {anime.format && (
                <Badge variant="default">{FORMAT_LABEL[anime.format] ?? anime.format}</Badge>
              )}
              {anime.isAdult && <Badge variant="red">18+</Badge>}
            </div>

            <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
              {anime.titleEnglish ?? anime.titleRomaji}
            </h1>
            {anime.titleEnglish && anime.titleRomaji !== anime.titleEnglish && (
              <p className="text-sm text-muted-foreground">{anime.titleRomaji}</p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              {anime.season && anime.seasonYear && (
                <span>{SEASON_LABEL[anime.season] ?? anime.season} {anime.seasonYear}</span>
              )}
              {anime.episodeCount && <span>{anime.episodeCount} episódios</span>}
              {anime.episodeDuration && <span>{anime.episodeDuration} min/ep</span>}
              {mainStudio && <span>{mainStudio.name}</span>}
              {anime.ratingAverage != null &&
                anime.ratingCount != null &&
                anime.ratingCount >= 1 && (
                <span
                  className="inline-flex items-center gap-1 font-semibold text-primary"
                  title="Hypômetro da comunidade"
                >
                  <Zap className="h-3.5 w-3.5" aria-hidden />
                  {Number(anime.ratingAverage).toFixed(1)}
                </span>
              )}
            </div>

            {/* Gêneros */}
            {anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((g) => (
                  <Link
                    key={g.id}
                    href={`/anime?genre=${encodeURIComponent(g.slug)}`}
                    className="rounded-full bg-purple-500/15 px-3 py-0.5 text-xs font-medium text-purple-300 transition-colors hover:bg-purple-500/25 hover:text-purple-200"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            <FollowAnimeButton slug={slug} className="mt-1 w-fit" />

            {anime.status === 'AIRING' && (
              <AnimeScheduleBanner animeId={anime.id} animeSlug={slug} />
            )}
          </div>
        </div>

        {/* Onde assistir */}
        <WhereToWatch links={anime.streamingLinks} />

        {/* Synopsis */}
        {anime.synopsis && (
          <section className="mt-8">
            <h2 className="mb-2 text-lg font-bold text-foreground">Sinopse</h2>
            <p className="leading-relaxed text-foreground/80 text-sm sm:text-base">{anime.synopsis}</p>
          </section>
        )}

        {/* Trailer */}
        {anime.trailerUrl && (
          <TrailerEmbed
            trailerUrl={anime.trailerUrl}
            title={anime.titleEnglish ?? anime.titleRomaji}
          />
        )}

        {/* Avaliações */}
        <section id="hypometro" className="mt-10 scroll-mt-24">
          <AnimeRatingSection slug={slug} />
        </section>

        {/* Episódios */}
        <section id="episodios" className="mb-10 mt-10 scroll-mt-24">
          <h2 className="mb-4 text-lg font-bold text-foreground">Episódios</h2>
          <AnimeEpisodesClient animeId={anime.id} animeSlug={slug} />
        </section>
      </div>
    </div>
  );
}
