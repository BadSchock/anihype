'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Bell } from 'lucide-react';
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

function placePanel(anchor: HTMLButtonElement) {
  const rect = anchor.getBoundingClientRect();
  const margin = 12;
  const top = rect.bottom + 8;
  const maxHeight = Math.max(160, window.innerHeight - top - margin);
  const maxWidth = window.innerWidth - margin * 2;
  const width = Math.min(320, maxWidth);
  const preferredLeft = rect.right - width;
  const fits = preferredLeft >= margin && preferredLeft + width <= window.innerWidth - margin;
  if (!fits) {
    return { top, left: margin, width: maxWidth, maxHeight };
  }
  return { top, left: preferredLeft, width, maxHeight };
}

export function NotificationsBell() {
  const { isAuthenticated } = useAuthHydrated();
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { data: unread } = useUnreadNotificationCount();
  const { data: list } = useNotifications(1);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (buttonRef.current) setPanel(placePanel(buttonRef.current));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  if (!isAuthenticated) return null;

  const count = unread?.unreadCount ?? 0;

  function handleOpen() {
    setOpen((value) => {
      const next = !value;
      if (next && buttonRef.current) setPanel(placePanel(buttonRef.current));
      return next;
    });
  }

  async function handleClickNotification(n: AppNotification) {
    if (!n.readAt) {
      await markRead.mutateAsync(n.id);
    }
    setOpen(false);
  }

  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        aria-label="Notificações"
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Bell className="h-4 w-4" aria-hidden />
        {count > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open &&
        panel &&
        createPortal(
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Fechar notificações"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl"
            style={{ top: panel.top, left: panel.left, width: panel.width, maxHeight: panel.maxHeight }}
          >
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
            <div className="min-h-0 flex-1 overflow-y-auto">
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
        </>,
        document.body,
      )}
    </div>
  );
}
