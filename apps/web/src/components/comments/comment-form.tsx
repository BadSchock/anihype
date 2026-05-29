'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useCreateComment } from '@/hooks/use-comments';
import { buildLoginUrl } from '@/lib/auth-url';

interface CommentFormProps {
  episodeId: number;
  parentId?: number;
  onCancel?: () => void;
  onSuccess?: () => void;
  placeholder?: string;
}

export function CommentForm({ episodeId, parentId, onCancel, onSuccess, placeholder }: CommentFormProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuthHydrated();
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { mutate: createComment, isPending } = useCreateComment(episodeId);

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl border border-border bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">
          <Link href={buildLoginUrl(pathname)} className="text-purple-400 hover:underline">
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
    setFormError(null);

    createComment(
      { content: content.trim(), parentId, isSpoiler },
      {
        onSuccess: () => {
          setContent('');
          setIsSpoiler(false);
          onSuccess?.();
          onCancel?.();
        },
        onError: (err) => {
          setFormError(err instanceof Error ? err.message : 'Não foi possível enviar o comentário.');
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
        className="input-base resize-none"
      />

      {formError && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{formError}</p>
      )}

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
              className="rounded-lg bg-muted px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted/80"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={!content.trim() || isPending}
            className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-purple-700 disabled:opacity-50"
          >
            {isPending ? 'Enviando...' : parentId ? 'Responder' : 'Comentar'}
          </button>
        </div>
      </div>
    </form>
  );
}
