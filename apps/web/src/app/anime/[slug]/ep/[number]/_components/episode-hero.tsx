import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { WhereToWatch } from '@/components/anime/where-to-watch';
import { SynopsisBlock } from '@/components/anime/synopsis-block';
import { episodeTimingLabel, formatAirTimeBrt, getEpisodeAiredAt, getEpisodeTiming } from '@/lib/date-brt';
import type { AnimeDetail, EpisodeWithAnime } from '@/types/api';

interface Props {
  anime: AnimeDetail;
  episode: EpisodeWithAnime;
  prevEpisode: EpisodeWithAnime | null;
  nextEpisode: EpisodeWithAnime | null;
}

export function EpisodeHero({ anime, episode, prevEpisode, nextEpisode }: Props) {
  const airedAt = getEpisodeAiredAt(episode);
  const airTimeLabel = airedAt ? formatAirTimeBrt(airedAt) : null;
  const timing = getEpisodeTiming(episode);
  const airDate = episode.airDate
    ? new Date(episode.airDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const heroImage = episode.thumbnailUrl ?? anime.bannerImageUrl;
  const animeTitle = anime.titleEnglish ?? anime.titleRomaji;

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      <div className="relative h-56 w-full overflow-hidden sm:h-80">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={episode.title ?? `Episódio ${episode.number}`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-purple-900/50 to-background" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-background/10" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-4xl px-4 pb-6 sm:px-6">
          <nav className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Link href={`/anime/${anime.slug}`} className="hover:text-purple-300 transition-colors">
              {animeTitle}
            </Link>
            <span>/</span>
            <span className="text-foreground/90">Ep {episode.number}</span>
          </nav>

          <div className="flex items-end gap-4">
            {anime.coverImageUrl && (
              <Link
                href={`/anime/${anime.slug}`}
                className="relative hidden h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg shadow-xl ring-2 ring-purple-500/30 sm:block sm:h-28 sm:w-20"
              >
                <Image
                  src={anime.coverImageUrl}
                  alt={animeTitle}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </Link>
            )}

            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-purple-600/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-200 ring-1 ring-purple-500/30">
                Episódio {episode.number}
              </div>
              <h1 className="text-2xl font-extrabold leading-tight text-foreground sm:text-4xl">
                {episode.title ?? `Episódio ${episode.number}`}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {airDate && <span>{airDate}</span>}
                {airTimeLabel && <span>{airTimeLabel} (BRT)</span>}
                {episode.durationMinutes && <span>{episode.durationMinutes} min</span>}
                {episode.commentCount != null && episode.commentCount > 0 && (
                  <span className="font-medium text-purple-300">
                    💬 {episode.commentCount} comentário{episode.commentCount !== 1 ? 's' : ''}
                  </span>
                )}
                <Badge
                  variant={timing === 'upcoming' ? 'yellow' : timing === 'unknown' ? 'default' : 'green'}
                >
                  {episodeTimingLabel(timing)}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <SynopsisBlock synopsis={episode.synopsis} title={null} />

        <WhereToWatch links={anime.streamingLinks ?? []} compact />

        <div className="mt-6 flex gap-3">
          {prevEpisode && (
            <Link
              href={`/anime/${anime.slug}/ep/${prevEpisode.number}`}
              className="rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:border-purple-500/30 hover:bg-muted/80"
            >
              ← Ep {prevEpisode.number}
            </Link>
          )}
          {nextEpisode && (
            <Link
              href={`/anime/${anime.slug}/ep/${nextEpisode.number}`}
              className="ml-auto rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-purple-700"
            >
              Ep {nextEpisode.number} →
            </Link>
          )}
        </div>

        <div className="my-8 border-t border-border" />

        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-purple-500" />
            </span>
            <h2 className="text-xl font-bold text-foreground">Discussão da comunidade</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Reações, teorias e hype do episódio — sem spoilers desnecessários.
          </p>
        </div>
      </div>
    </div>
  );
}
