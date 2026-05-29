'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createComment, getEpisodeComments, toggleCommentLike } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

export function useEpisodeComments(episodeId: number, page = 1) {
  const authReady = useAuthStore((s) => s.authReady);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['comments', 'episode', episodeId, page, accessToken ?? 'guest'],
    queryFn: () =>
      getEpisodeComments(episodeId, page, 20, {
        token: accessToken ?? undefined,
        rootOnly: true,
      }),
    enabled: authReady && episodeId > 0,
  });
}

export function useCommentReplies(episodeId: number, parentId: number | null) {
  const authReady = useAuthStore((s) => s.authReady);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['comments', 'replies', episodeId, parentId, accessToken ?? 'guest'],
    queryFn: () =>
      getEpisodeComments(episodeId, 1, 50, {
        token: accessToken ?? undefined,
        parentId: parentId!,
      }),
    enabled: authReady && episodeId > 0 && parentId !== null,
  });
}

export function useCreateComment(episodeId: number) {
  const { accessToken, user } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { content: string; parentId?: number; isSpoiler?: boolean }) =>
      createComment({ episodeId, ...body }, accessToken ?? ''),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['comments', 'episode', episodeId] });
      if (variables.parentId) {
        await queryClient.invalidateQueries({
          queryKey: ['comments', 'replies', episodeId, variables.parentId],
        });
      }
      if (user?.username) {
        void queryClient.invalidateQueries({ queryKey: ['hype', user.username] });
      }
    },
  });
}

export function useToggleLike() {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => toggleCommentLike(commentId, accessToken ?? ''),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
