'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { buildLoginUrl } from '@/lib/auth-url';
import { FeedPageClient } from './_components/feed-page-client';

export default function FeedPageGuard() {
  const { authReady, isAuthenticated } = useAuthHydrated();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace(buildLoginUrl('/feed'));
    }
  }, [authReady, isAuthenticated, router]);

  if (!authReady || !isAuthenticated) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Carregando feed...
      </div>
    );
  }

  return <FeedPageClient />;
}
