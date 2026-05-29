'use client';

import { useMyFeed } from '@/hooks/use-feed';
import { FeedItemCard } from '@/components/feed/feed-item-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import Link from 'next/link';

export function FeedPageClient() {
  const { data, isLoading, isError, refetch } = useMyFeed(1);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Seu feed</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Atividade de quem você segue — comentários, avaliações e animes novos.
        </p>
      </div>

      {isError && (
        <ErrorState message="Não foi possível carregar o feed." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl border border-border shimmer" />
          ))}
        </div>
      )}

      {!isLoading && !isError && !data?.data.length && (
        <div className="flex flex-col items-center gap-3">
          <EmptyState
            title="Feed vazio"
            description="Siga outros usuários para ver a atividade deles aqui."
          />
          <Link href="/anime" className="text-sm text-purple-400 hover:underline">
            Explorar animes →
          </Link>
        </div>
      )}

      {!isLoading && !isError && data?.data.length ? (
        <div className="flex flex-col gap-3">
          {data.data.map((item, i) => (
            <FeedItemCard key={`${item.type}-${item.createdAt}-${i}`} item={item} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
