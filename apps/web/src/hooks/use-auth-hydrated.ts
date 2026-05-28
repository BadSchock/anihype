'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import type { AuthUser } from '@/types/api';

/**
 * Auth persistido no localStorage só existe no cliente.
 * Até hidratar, devolve estado "deslogado" igual ao SSR — evita hydration mismatch.
 */
export function useAuthHydrated(): {
  hydrated: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
} {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);

    if (useAuthStore.persist.hasHydrated()) {
      finish();
      return;
    }

    return useAuthStore.persist.onFinishHydration(finish);
  }, []);

  return {
    hydrated,
    isAuthenticated: hydrated && isAuthenticated,
    user: hydrated ? user : null,
  };
}
