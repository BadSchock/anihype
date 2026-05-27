import { AnimeCardSkeleton } from '@/components/anime/anime-card';

export default function AnimeListLoading() {
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="h-8 w-24 rounded-lg shimmer" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 24 }).map((_, i) => <AnimeCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
