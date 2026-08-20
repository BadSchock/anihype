'use client';

import { cn } from '@anihype/ui';
import type { EquippedBadge } from '@/types/api';

interface Props {
  badge: EquippedBadge;
  className?: string;
  size?: 'sm' | 'md';
}

/** Compact achievement chip next to a username. */
export function EquippedBadgeChip({ badge, className, size = 'sm' }: Props) {
  const color = badge.rarityColor ?? '#A855F7';
  return (
    <span
      className={cn(
        'inline-flex max-w-[10rem] items-center truncate rounded-full border font-semibold',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        className,
      )}
      style={{
        borderColor: `${color}66`,
        color,
        backgroundColor: `${color}18`,
      }}
      title={badge.name}
    >
      {badge.name}
    </span>
  );
}
