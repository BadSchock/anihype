'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  updateMyProfile,
  uploadMyAvatar,
  type MeProfile,
  type UpdateProfilePayload,
} from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

/** Reflete a resposta da API no Zustand — header, avatar, etc. atualizam sem F5. */
function applyMeToStore(me: MeProfile) {
  const state = useAuthStore.getState();
  if (!state.accessToken || !state.refreshToken) return;

  state.setAuth(
    {
      id: me.id,
      email: me.email,
      username: me.username,
      displayName: me.displayName,
      avatarUrl: me.avatarUrl,
      roles: me.roles,
    },
    state.accessToken,
    state.refreshToken,
  );
}

function invalidateProfileQueries(
  qc: ReturnType<typeof useQueryClient>,
  username: string,
) {
  void qc.invalidateQueries({ queryKey: ['public-profile', username] });
  void qc.invalidateQueries({ queryKey: ['profile', username] });
  void qc.invalidateQueries({ queryKey: ['badges', username] });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      updateMyProfile(payload, accessToken ?? undefined),
    onSuccess: (me) => {
      applyMeToStore(me);
      invalidateProfileQueries(qc, me.username);
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  return useMutation({
    mutationFn: (file: File) => uploadMyAvatar(file, accessToken ?? undefined),
    onSuccess: (me) => {
      applyMeToStore(me);
      invalidateProfileQueries(qc, me.username);
    },
  });
}
