'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { authReady, isAuthenticated, user } = useAuthHydrated();
  const router = useRouter();
  const isAdmin = user?.roles.includes('ADMIN');

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !isAdmin) {
      router.replace('/');
    }
  }, [authReady, isAuthenticated, isAdmin, router]);

  if (!authReady || !isAuthenticated || !isAdmin) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        Verificando permissões...
      </div>
    );
  }

  return <>{children}</>;
}
