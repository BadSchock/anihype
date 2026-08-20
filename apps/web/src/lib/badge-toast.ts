'use client';

import type { AwardedBadge } from '@/types/api';

let host: HTMLDivElement | null = null;

function ensureHost() {
  if (typeof document === 'undefined') return null;
  if (host) return host;
  host = document.createElement('div');
  host.id = 'anihype-badge-toasts';
  host.className =
    'pointer-events-none fixed bottom-20 left-1/2 z-[100] flex w-[min(100%-2rem,22rem)] -translate-x-1/2 flex-col gap-2 sm:bottom-6';
  document.body.appendChild(host);
  return host;
}

function spawnConfetti(color: string) {
  const root = document.createElement('div');
  root.className = 'pointer-events-none fixed inset-0 z-[99] overflow-hidden';
  document.body.appendChild(root);

  for (let i = 0; i < 18; i++) {
    const piece = document.createElement('span');
    const left = 20 + Math.random() * 60;
    const delay = Math.random() * 0.2;
    const duration = 0.9 + Math.random() * 0.5;
    piece.style.cssText = `
      position:absolute;top:42%;left:${left}%;width:6px;height:10px;
      background:${color};border-radius:1px;opacity:0.95;
      transform:rotate(${Math.random() * 360}deg);
      animation:anihype-confetti-fall ${duration}s ease-out ${delay}s forwards;
    `;
    root.appendChild(piece);
  }

  window.setTimeout(() => root.remove(), 1800);
}

/** Lightweight toast + CSS confetti (no extra dependency). */
export function showBadgeUnlock(badge: AwardedBadge) {
  const parent = ensureHost();
  if (!parent) return;

  const color = badge.rarityColor ?? '#A855F7';
  spawnConfetti(color);

  const el = document.createElement('div');
  el.setAttribute('role', 'status');
  el.className =
    'pointer-events-auto animate-in fade-in slide-in-from-bottom-2 rounded-xl border bg-card px-4 py-3 shadow-lg';
  el.style.borderColor = `${color}55`;
  el.innerHTML = `
    <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Nova conquista</p>
    <p class="mt-0.5 text-sm font-bold text-foreground">${escapeHtml(badge.name)}</p>
  `;
  parent.appendChild(el);

  window.setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 300ms';
    window.setTimeout(() => el.remove(), 320);
  }, 4200);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
