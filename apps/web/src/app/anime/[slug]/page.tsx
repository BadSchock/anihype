import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getAnimeBySlug } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { AnimeEpisodesClient } from './_components/anime-episodes-client';

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
          <div className="h-full w-full bg-gradient-to-br from-purple-900/40 to-[#0F1115]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/40 to-transparent" />
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
              <div className="h-full w-full bg-white/10" />
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

            <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              {anime.titleEnglish ?? anime.titleRomaji}
            </h1>
            {anime.titleEnglish && anime.titleRomaji !== anime.titleEnglish && (
              <p className="text-sm text-white/50">{anime.titleRomaji}</p>
            )}

            {/* Metadata row */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/50">
              {anime.season && anime.seasonYear && (
                <span>{SEASON_LABEL[anime.season] ?? anime.season} {anime.seasonYear}</span>
              )}
              {anime.episodeCount && <span>{anime.episodeCount} episódios</span>}
              {anime.episodeDuration && <span>{anime.episodeDuration} min/ep</span>}
              {mainStudio && <span>{mainStudio.name}</span>}
              {anime.averageScore && (
                <span className="text-yellow-400 font-medium">
                  ★ {(anime.averageScore / 10).toFixed(1)}
                </span>
              )}
            </div>

            {/* Gêneros */}
            {anime.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full bg-purple-500/15 px-3 py-0.5 text-xs font-medium text-purple-300"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Synopsis */}
        {anime.synopsis && (
          <section className="mt-8">
            <h2 className="mb-2 text-lg font-bold text-white">Sinopse</h2>
            <p className="leading-relaxed text-white/70 text-sm sm:text-base">{anime.synopsis}</p>
          </section>
        )}

        {/* Episódios */}
        <section className="mt-10 mb-10">
          <h2 className="mb-4 text-lg font-bold text-white">Episódios</h2>
          <AnimeEpisodesClient animeId={anime.id} />
        </section>
      </div>
    </div>
  );
}
