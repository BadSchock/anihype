'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, logout, refreshTokens, register } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: async (response) => {
      setAuth(response.user, response.tokens.accessToken, response.tokens.refreshToken);
      useAuthStore.getState().setAuthReady(true);
      await queryClient.invalidateQueries();
    },
  });
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      username,
      email,
      password,
    }: {
      username: string;
      email: string;
      password: string;
    }) => register(username, email, password),
    onSuccess: async (response) => {
      setAuth(response.user, response.tokens.accessToken, response.tokens.refreshToken);
      useAuthStore.getState().setAuthReady(true);
      await queryClient.invalidateQueries();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const state = useAuthStore.getState();
      let accessToken = state.accessToken;

      if (!accessToken && state.refreshToken && state.user) {
        const tokens = await refreshTokens(state.user.id, state.refreshToken);
        state.setAuth(state.user, tokens.accessToken, tokens.refreshToken);
        accessToken = tokens.accessToken;
      }

      if (accessToken && state.refreshToken) {
        await logout(accessToken, state.refreshToken);
      }
    },
    onSettled: async () => {
      useAuthStore.getState().logout();
      await queryClient.clear();
    },
  });
}
