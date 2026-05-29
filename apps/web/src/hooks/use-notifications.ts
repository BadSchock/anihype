'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/api';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';

export function useNotifications(page = 1) {
  const { isAuthenticated } = useAuthHydrated();

  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => getMyNotifications(page),
    enabled: isAuthenticated,
    staleTime: 15_000,
  });
}

export function useUnreadNotificationCount() {
  const { isAuthenticated } = useAuthHydrated();

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadNotificationCount,
    enabled: isAuthenticated,
    refetchInterval: 60_000,
    staleTime: 15_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
