'use client';

import { useState } from 'react';
import { useEpisodeComments } from '@/hooks/use-comments';
import { CommentItem, CommentItemSkeleton } from './comment-item';
import { CommentForm } from './comment-form';
import { EmptyState } from '@/components/ui/empty-state';

interface CommentsSectionProps {
  episodeId: number;
}

export function CommentsSection({ episodeId }: CommentsSectionProps) {
  const [page, setPage] = useState(1);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const { data, isLoading } = useEpisodeComments(episodeId, page);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-bold text-white">
        Comentários
        {data?.meta.total ? (
          <span className="ml-2 text-sm font-normal text-white/40">({data.meta.total})</span>
        ) : null}
      </h2>

      {/* Formulário principal */}
      <CommentForm episodeId={episodeId} />

      {/* Lista */}
      {isLoading && (
        <div className="flex flex-col gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CommentItemSkeleton key={i} />
          ))}
        </div>
      )}

      {!isLoading && (!data?.data || data.data.length === 0) && (
        <EmptyState
          title="Sem comentários ainda"
          description="Seja o primeiro a comentar neste episódio!"
        />
      )}

      {!isLoading && data?.data && data.data.length > 0 && (
        <div className="flex flex-col divide-y divide-white/5">
          {data.data.map((comment) => (
            <div key={comment.id} className="py-4">
              <CommentItem
                comment={comment}
                onReply={(id) => setReplyTo(replyTo === id ? null : id)}
              />
              {replyTo === comment.id && (
                <div className="ml-11 mt-3">
                  <CommentForm
                    episodeId={episodeId}
                    parentId={comment.id}
                    placeholder={`Respondendo @${comment.author.username}...`}
                    onCancel={() => setReplyTo(null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
          >
            ← Anterior
          </button>
          <span className="text-sm text-white/50">{page} / {data.meta.totalPages}</span>
          <button
            disabled={page === data.meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white disabled:opacity-30 hover:bg-white/20 transition-colors"
          >
            Próximo →
          </button>
        </div>
      )}
    </div>
  );
}
