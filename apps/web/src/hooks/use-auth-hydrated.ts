'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthUser } from '@/types/api';

/**
 * Auth persistido no localStorage só existe no cliente.
 * Aguarda hidratação do Zustand + refresh no boot antes de expor sessão.
 */
export function useAuthHydrated(): {
  hydrated: boolean;
  authReady: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
} {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const authReady = useAuthStore((s) => s.authReady);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);

    if (useAuthStore.persist.hasHydrated()) {
      finish();
      return;
    }

    return useAuthStore.persist.onFinishHydration(finish);
  }, []);

  const ready = hydrated && authReady;

  return {
    hydrated,
    authReady: ready,
    isAuthenticated: ready && isAuthenticated,
    user: ready ? user : null,
    accessToken: ready ? accessToken : null,
  };
}
