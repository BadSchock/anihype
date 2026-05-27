import { AnimeCardSkeleton } from '@/components/anime/anime-card';
import { EpisodeCardSkeleton } from '@/components/episode/episode-card';

export default function HomeLoading() {
  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      {/* Hero placeholder */}
      <div className="-mx-4 -mt-6 h-52 bg-gradient-to-br from-purple-900/20 to-transparent sm:-mx-6" />

      {/* Today */}
      <section>
        <div className="mb-4 h-6 w-48 rounded-lg shimmer" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <EpisodeCardSkeleton key={i} />)}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className="mb-4 h-6 w-36 rounded-lg shimmer" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => <AnimeCardSkeleton key={i} />)}
        </div>
      </section>
    </div>
  );
}
