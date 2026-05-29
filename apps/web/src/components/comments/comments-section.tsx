'use client';

import { useState } from 'react';
import { useEpisodeComments } from '@/hooks/use-comments';
import { CommentItem, CommentItemSkeleton } from './comment-item';
import { CommentForm } from './comment-form';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';

interface CommentsSectionProps {
  episodeId: number;
}

export function CommentsSection({ episodeId }: CommentsSectionProps) {
  const [page, setPage] = useState(1);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [openReplies, setOpenReplies] = useState<Set<number>>(new Set());
  const { data, isLoading, isError, refetch } = useEpisodeComments(episodeId, page);

  const toggleReplies = (commentId: number) => {
    setOpenReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold text-foreground">
        Comentários
        {data?.meta.total ? (
          <span className="ml-2 text-sm font-normal text-muted-foreground">({data.meta.total})</span>
        ) : null}
      </h2>

      <CommentForm episodeId={episodeId} />

      {isError && (
        <ErrorState message="Não foi possível carregar os comentários." onRetry={() => refetch()} />
      )}

      {isLoading && (
        <div className="flex flex-col gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CommentItemSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && !isError && (!data?.data || data.data.length === 0) && (
        <EmptyState
          title="Sem comentários ainda"
          description="Seja o primeiro a comentar neste episódio!"
        />
      )}

      {!isLoading && !isError && data?.data && data.data.length > 0 && (
        <div className="flex flex-col divide-y divide-border">
          {data.data.map((comment) => (
            <div key={comment.id} className="py-4">
              <CommentItem
                comment={comment}
                episodeId={episodeId}
                repliesOpen={openReplies.has(comment.id)}
                onToggleReplies={() => toggleReplies(comment.id)}
                onReply={(id) => setReplyTo(replyTo === id ? null : id)}
              />
              {replyTo === comment.id && (
                <div className="ml-11 mt-3">
                  <CommentForm
                    episodeId={episodeId}
                    parentId={comment.id}
                    placeholder={`Respondendo @${comment.author.username}...`}
                    onCancel={() => setReplyTo(null)}
                    onSuccess={() => {
                      setOpenReplies((prev) => new Set(prev).add(comment.id));
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/80 disabled:opacity-30"
          >
            ← Anterior
          </button>
          <span className="text-sm text-muted-foreground">
            {page} / {data.meta.totalPages}
          </span>
          <button
            disabled={page === data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg bg-muted px-4 py-2 text-sm text-foreground transition-colors hover:bg-muted/80 disabled:opacity-30"
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}
