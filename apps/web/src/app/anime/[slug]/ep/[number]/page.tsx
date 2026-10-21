import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAnimeBySlug, getEpisodeByNumber } from '@/services/api';
import { CommentsSection } from '@/components/comments/comments-section';
import { EpisodeHypometerCta } from '@/components/ratings/episode-hypometer-cta';
import { synopsisPlainText } from '@/lib/format-synopsis';
import { EpisodeHero } from './_components/episode-hero';

interface Props {
  params: Promise<{ slug: string; number: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, number } = await params;
  try {
    const anime = await getAnimeBySlug(slug);
    const ep = await getEpisodeByNumber(anime.id, parseInt(number, 10));
    const title = ep.title ?? `Episódio ${ep.number}`;
    return {
      title: `${title} — ${anime.titleEnglish ?? anime.titleRomaji}`,
      description: synopsisPlainText(ep.synopsis),
      openGraph: {
        images: ep.thumbnailUrl ?? anime.bannerImageUrl ?? undefined,
      },
    };
  } catch {
    return { title: 'Episódio não encontrado' };
  }
}

export default async function EpisodePage({ params }: Props) {
  const { slug, number } = await params;
  const epNumber = parseInt(number, 10);
  if (isNaN(epNumber)) notFound();

  let anime;
  let episode;
  let prevEpisode: Awaited<ReturnType<typeof getEpisodeByNumber>> | null = null;
  let nextEpisode: Awaited<ReturnType<typeof getEpisodeByNumber>> | null = null;

  try {
    anime = await getAnimeBySlug(slug);
    episode = await getEpisodeByNumber(anime.id, epNumber);
  } catch {
    notFound();
  }

  if (epNumber > 1) {
    try {
      prevEpisode = await getEpisodeByNumber(anime.id, epNumber - 1);
    } catch {
      prevEpisode = null;
    }
  }

  try {
    nextEpisode = await getEpisodeByNumber(anime.id, epNumber + 1);
  } catch {
    nextEpisode = null;
  }

  return (
    <>
      <EpisodeHero
        anime={anime}
        episode={episode}
        prevEpisode={prevEpisode}
        nextEpisode={nextEpisode}
      />
      <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6">
        <EpisodeHypometerCta
          slug={slug}
          animeTitle={anime.titleEnglish ?? anime.titleRomaji}
        />
        <CommentsSection episodeId={episode.id} />
      </div>
    </>
  );
}
