import { EpisodeCarouselSkeleton } from '@/components/episode/episode-carousel';
import { AnimeCardSkeleton } from '@/components/anime/anime-card';

function SectionSkeleton({ titleWidth }: { titleWidth: string }) {
  return (
    <section>
      <div className={`mb-4 h-6 ${titleWidth} rounded-lg shimmer`} />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <EpisodeCarouselSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function HomeSectionsSkeleton() {
  return (
    <>
      <SectionSkeleton titleWidth="w-48" />
      <SectionSkeleton titleWidth="w-40" />
      <section>
        <div className="mb-4 h-6 w-36 rounded-lg shimmer" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <AnimeCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </>
  );
}
