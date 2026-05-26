'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { login, logout, register } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      login(email, password),
    onSuccess: async (tokens) => {
      // Busca dados do user depois do login
      const { getMe } = await import('@/services/api');
      const user = await getMe(tokens.accessToken);
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      await queryClient.invalidateQueries();
    },
  });
}

export function useRegister() {
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
  });
}

export function useLogout() {
  const { accessToken, logout: storeLogout } = useAuthStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(accessToken ?? ''),
    onSettled: async () => {
      storeLogout();
      await queryClient.clear();
    },
  });
}
