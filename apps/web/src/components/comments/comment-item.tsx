'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useCommentReplies, useToggleLike } from '@/hooks/use-comments';
import { buildLoginUrl } from '@/lib/auth-url';
import { UserAvatar } from '@/components/user/user-avatar';
import { EquippedBadgeChip } from '@/components/badges/equipped-badge-chip';
import type { Comment } from '@/types/api';
import { censorText } from '@/lib/censor-text';

interface CommentItemProps {
  comment: Comment;
  episodeId: number;
  onReply?: (parentId: number) => void;
  nested?: boolean;
  repliesOpen?: boolean;
  onToggleReplies?: () => void;
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

export function CommentItem({
  comment,
  episodeId,
  onReply,
  nested = false,
  repliesOpen: repliesOpenProp,
  onToggleReplies,
}: CommentItemProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [repliesOpenLocal, setRepliesOpenLocal] = useState(false);
  const repliesOpen = repliesOpenProp ?? repliesOpenLocal;
  const setRepliesOpen = onToggleReplies ?? (() => setRepliesOpenLocal((open) => !open));
  const { isAuthenticated } = useAuthHydrated();
  const { mutate: toggleLike, isPending: liking } = useToggleLike();
  const { data: replies, isLoading: loadingReplies } = useCommentReplies(
    episodeId,
    repliesOpen ? comment.id : null,
  );

  const handleLike = () => {
    if (!isAuthenticated) {
      router.push(buildLoginUrl(pathname));
      return;
    }
    toggleLike(comment.id);
  };

  const safeContent = censorText(comment.content);

  return (
    <div className={`flex gap-3 ${nested ? '' : ''}`}>
      <div className="flex-shrink-0">
        <UserAvatar name={comment.author.username} avatarUrl={comment.author.avatarUrl} size="sm" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/80">{comment.author.username}</span>
          {comment.author.equippedBadge ? (
            <EquippedBadgeChip badge={comment.author.equippedBadge} />
          ) : null}
          <span>·</span>
          <span>{timeAgo(comment.createdAt)}</span>
          {comment.editedAt && <span>(editado)</span>}
          {comment.isSpoiler && (
            <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-yellow-400">
              spoiler
            </span>
          )}
        </div>

        {comment.isSpoiler ? (
          <div className="relative">
            <p
              className="text-sm leading-relaxed text-foreground/90 transition-all duration-300"
              style={{
                filter: spoilerRevealed ? 'none' : 'blur(6px)',
                userSelect: spoilerRevealed ? 'text' : 'none',
              }}
            >
              {safeContent}
            </p>
            {!spoilerRevealed && (
              <button
                type="button"
                onClick={() => setSpoilerRevealed(true)}
                className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-yellow-500/10 text-sm font-medium text-yellow-400 transition-colors hover:bg-yellow-500/20"
              >
                <span>⚠️</span>
                <span>Spoiler — clique para revelar</span>
              </button>
            )}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-foreground/90">{safeContent}</p>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-1 transition-colors hover:text-foreground ${
              comment.likedByMe ? 'text-purple-400' : ''
            }`}
          >
            ♥ {comment.likeCount > 0 ? comment.likeCount : ''}
          </button>

          {onReply && isAuthenticated && (
            <button
              type="button"
              onClick={() => onReply(comment.id)}
              className="transition-colors hover:text-foreground"
            >
              Responder
            </button>
          )}

          {comment.replyCount > 0 && !nested && (
            <button
              type="button"
              onClick={() => setRepliesOpen()}
              className="font-medium text-purple-400 transition-colors hover:text-purple-300"
            >
              {repliesOpen
                ? 'Ocultar respostas'
                : `Ver ${comment.replyCount} resposta${comment.replyCount > 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        {repliesOpen && (
          <div className="mt-3 flex flex-col gap-4 border-l-2 border-purple-500/20 pl-4">
            {loadingReplies &&
              Array.from({ length: Math.min(comment.replyCount, 2) }).map((_, i) => (
                <CommentItemSkeleton key={i} />
              ))}

            {!loadingReplies &&
              replies?.data.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  episodeId={episodeId}
                  nested
                />
              ))}

            {!loadingReplies && replies?.data.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma resposta encontrada.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentItemSkeleton() {
  return (
    <div className="flex gap-3">
      <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-muted" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
