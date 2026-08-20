'use client';

import { Award } from 'lucide-react';
import { cn } from '@anihype/ui';
import type { EquippedBadge } from '@/types/api';

interface Props {
  badge: EquippedBadge;
  className?: string;
  size?: 'sm' | 'md';
}

function withAlpha(hex: string, alphaHex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length === 6) return `#${clean}${alphaHex}`;
  if (clean.length === 8) return `#${clean.slice(0, 6)}${alphaHex}`;
  return hex;
}

/** Compact achievement chip next to a username. */
export function EquippedBadgeChip({ badge, className, size = 'sm' }: Props) {
  const color = badge.rarityColor?.trim() || '#A855F7';
  return (
    <span
      className={cn(
        'inline-flex max-w-[14rem] shrink-0 items-center gap-1 truncate rounded-md border font-semibold leading-none',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs',
        className,
      )}
      style={{
        borderColor: withAlpha(color, '99'),
        color,
        backgroundColor: withAlpha(color, '22'),
      }}
      title={badge.name}
    >
      <Award className={size === 'sm' ? 'h-3 w-3 shrink-0' : 'h-3.5 w-3.5 shrink-0'} aria-hidden />
      <span className="truncate">{badge.name}</span>
    </span>
  );
}
