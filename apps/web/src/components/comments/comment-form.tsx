'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useCreateComment } from '@/hooks/use-comments';
import Link from 'next/link';

interface CommentFormProps {
  episodeId: number;
  parentId?: number;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({ episodeId, parentId, onCancel, placeholder }: CommentFormProps) {
  const { isAuthenticated } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const { mutate: createComment, isPending } = useCreateComment(episodeId);

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-border bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="text-purple-400 hover:underline">
            Entre na sua conta
          </Link>{' '}
          para comentar neste episódio.
        </p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    createComment(
      { content: content.trim(), parentId, isSpoiler },
      {
        onSuccess: () => {
          setContent('');
          setIsSpoiler(false);
          onCancel?.();
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder ?? 'Escreva seu comentário...'}
        rows={3}
        maxLength={5000}
        className="w-full resize-none rounded-xl bg-muted p-3 text-sm text-foreground placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
      />
      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={isSpoiler}
            onChange={(e) => setIsSpoiler(e.target.checked)}
            className="accent-yellow-400"
          />
          Marcar como spoiler
        </label>
        <div className="flex gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isPending}
            className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-foreground hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Enviando...' : 'Comentar'}
          </button>
        </div>
      </div>
    </form>
  );
}
