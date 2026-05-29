'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { bootstrapAuthSession } from '@/services/api';

function waitForAuthHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useAuthStore.persist.hasHydrated()) {
      resolve();
      return;
    }

    const unsub = useAuthStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      await waitForAuthHydration();
      if (cancelled) return;
      await bootstrapAuthSession();
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return children;
}
