import { Suspense } from 'react';
import { AnimeCatalog } from './_components/anime-catalog';
import { AnimeCardSkeleton } from '@/components/anime/anime-card';

function CatalogFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="h-40 animate-pulse rounded-xl bg-muted/50" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <AnimeCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function AnimeListPage() {
  return (
    <Suspense fallback={<CatalogFallback />}>
      <AnimeCatalog />
    </Suspense>
  );
}
