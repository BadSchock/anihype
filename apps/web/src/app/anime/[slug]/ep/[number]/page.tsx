import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAnimeBySlug, getEpisodeByNumber } from '@/services/api';
import { CommentsSection } from '@/components/comments/comments-section';
import { Badge } from '@/components/ui/badge';

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
      description: ep.synopsis?.slice(0, 160) ?? undefined,
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
  try {
    anime = await getAnimeBySlug(slug);
    episode = await getEpisodeByNumber(anime.id, epNumber);
  } catch {
    notFound();
  }

  const airDate = episode.airDate
    ? new Date(episode.airDate).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="-mx-4 -mt-6 sm:-mx-6">
      {/* Thumbnail / banner */}
      <div className="relative h-48 w-full overflow-hidden sm:h-64">
        {(episode.thumbnailUrl ?? anime.bannerImageUrl) ? (
          <Image
            src={(episode.thumbnailUrl ?? anime.bannerImageUrl)!}
            alt={episode.title ?? `Episódio ${episode.number}`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-purple-900/40 to-[#0F1115]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/30 to-transparent" />
      </div>

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-white/40">
          <Link href={`/anime/${anime.slug}`} className="hover:text-purple-400 transition-colors">
            {anime.titleEnglish ?? anime.titleRomaji}
          </Link>
          <span>/</span>
          <span className="text-white/70">Ep {episode.number}</span>
        </nav>

        {/* Título */}
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl">
          {episode.title ?? `Episódio ${episode.number}`}
        </h1>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/50">
          {airDate && <span>📅 {airDate}</span>}
          {episode.durationMinutes && <span>⏱ {episode.durationMinutes} min</span>}
          <Badge
            variant={
              episode.status === 'AIRED' ? 'green' :
              episode.status === 'UPCOMING' ? 'yellow' : 'default'
            }
          >
            {episode.status === 'AIRED' ? 'Exibido' : episode.status === 'UPCOMING' ? 'Em breve' : 'Desconhecido'}
          </Badge>
        </div>

        {/* Sinopse */}
        {episode.synopsis && (
          <p className="mt-5 text-sm leading-relaxed text-white/70">{episode.synopsis}</p>
        )}

        {/* Navegação entre episódios */}
        <div className="mt-6 flex gap-3">
          {epNumber > 1 && (
            <Link
              href={`/anime/${anime.slug}/ep/${epNumber - 1}`}
              className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition-colors"
            >
              ← Ep {epNumber - 1}
            </Link>
          )}
          {anime.episodeCount && epNumber < anime.episodeCount && (
            <Link
              href={`/anime/${anime.slug}/ep/${epNumber + 1}`}
              className="ml-auto rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
            >
              Ep {epNumber + 1} →
            </Link>
          )}
        </div>

        {/* Separador */}
        <div className="my-8 border-t border-white/10" />

        {/* Área de comentários */}
        <CommentsSection episodeId={episode.id} />
      </div>
    </div>
  );
}
