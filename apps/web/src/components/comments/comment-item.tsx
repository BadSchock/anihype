'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useToggleLike } from '@/hooks/use-comments';
import type { Comment } from '@/types/api';

interface CommentItemProps {
  comment: Comment;
  onReply?: (parentId: number) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function CommentItem({ comment, onReply }: CommentItemProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { mutate: toggleLike } = useToggleLike();

  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/30 text-xs font-bold text-purple-300">
          {comment.author.username.charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="font-medium text-white/70">{comment.author.username}</span>
          <span>·</span>
          <span>{timeAgo(comment.createdAt)}</span>
          {comment.editedAt && <span>(editado)</span>}
          {comment.isSpoiler && (
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-yellow-400">
              spoiler
            </span>
          )}
        </div>

        {/* Content */}
        {comment.isSpoiler && !spoilerRevealed ? (
          <button
            onClick={() => setSpoilerRevealed(true)}
            className="w-fit rounded-lg bg-yellow-500/10 px-3 py-1.5 text-sm text-yellow-400 hover:bg-yellow-500/20 transition-colors"
          >
            Clique para revelar spoiler
          </button>
        ) : (
          <p className="text-sm leading-relaxed text-white/80">{comment.content}</p>
        )}

        {/* Actions */}
        <div className="mt-1 flex items-center gap-4 text-xs text-white/40">
          <button
            onClick={() => isAuthenticated && toggleLike(comment.id)}
            className={`flex items-center gap-1 transition-colors hover:text-white ${
              comment.likedByMe ? 'text-purple-400' : ''
            }`}
          >
            ♥ {comment.likeCount > 0 ? comment.likeCount : ''}
          </button>

          {onReply && isAuthenticated && (
            <button
              onClick={() => onReply(comment.id)}
              className="transition-colors hover:text-white"
            >
              Responder
            </button>
          )}

          {comment.replyCount > 0 && (
            <span>{comment.replyCount} resposta{comment.replyCount > 1 ? 's' : ''}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function CommentItemSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-white/10" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
      </div>
    </div>
  );
}
