'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createComment, getEpisodeComments, toggleCommentLike } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

export function useEpisodeComments(episodeId: number, page = 1) {
  const { accessToken } = useAuthStore();
  return useQuery({
    queryKey: ['comments', 'episode', episodeId, page],
    queryFn: () => getEpisodeComments(episodeId, page, 20, accessToken ?? undefined),
    enabled: episodeId > 0,
  });
}

export function useCreateComment(episodeId: number) {
  const { accessToken } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: { content: string; parentId?: number; isSpoiler?: boolean }) =>
      createComment({ episodeId, ...body }, accessToken ?? ''),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['comments', 'episode', episodeId] });
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
