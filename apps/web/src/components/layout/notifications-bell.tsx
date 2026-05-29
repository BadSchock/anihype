'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/use-notifications';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import type { AppNotification } from '@/types/api';

function notificationHref(n: AppNotification): string | null {
  const p = n.payload;
  if (!p) return null;
  if (n.topic === 'USER_FOLLOWED' && typeof p['username'] === 'string') {
    return `/u/${p['username']}`;
  }
  if (
    (n.topic === 'COMMENT_LIKED' || n.topic === 'COMMENT_REPLY' || n.topic === 'NEW_EPISODE') &&
    typeof p['animeSlug'] === 'string' &&
    typeof p['episodeNumber'] === 'number'
  ) {
    return `/anime/${p['animeSlug']}/ep/${p['episodeNumber']}`;
  }
  return null;
}

export function NotificationsBell() {
  const { isAuthenticated } = useAuthHydrated();
  const [open, setOpen] = useState(false);
  const { data: unread } = useUnreadNotificationCount();
  const { data: list } = useNotifications(1);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (!isAuthenticated) return null;

  const count = unread?.unreadCount ?? 0;

  async function handleOpen() {
    setOpen((v) => !v);
  }

  async function handleClickNotification(n: AppNotification) {
    if (!n.readAt) {
      await markRead.mutateAsync(n.id);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void handleOpen()}
        aria-label="Notificações"
        className="relative btn-ghost px-2.5 py-1.5 text-sm"
      >
        🔔
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Fechar notificações"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-semibold text-foreground">Notificações</span>
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => void markAll.mutateAsync()}
                  className="text-xs text-purple-400 hover:underline"
                >
                  Marcar todas lidas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {!list?.data.length && (
                <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma notificação.</p>
              )}
              {list?.data.map((n) => {
                const href = notificationHref(n);
                const inner = (
                  <div
                    className={`border-b border-border/50 px-3 py-3 text-left transition-colors hover:bg-muted/50 ${
                      !n.readAt ? 'bg-purple-500/5' : ''
                    }`}
                  >
                    <p className="text-sm text-foreground/90">{n.body}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                );

                if (href) {
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={() => void handleClickNotification(n)}
                    >
                      {inner}
                    </Link>
                  );
                }

                return (
                  <button
                    key={n.id}
                    type="button"
                    className="block w-full"
                    onClick={() => void handleClickNotification(n)}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
