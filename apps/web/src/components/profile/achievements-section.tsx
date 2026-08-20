'use client';

import { CheckCircle2, Lock } from 'lucide-react';
import { cn } from '@anihype/ui';
import { useEquipBadge, useUserBadges } from '@/hooks/use-badges';
import type { BadgeProgress } from '@/types/api';

interface Props {
  username: string;
  isOwner: boolean;
  className?: string;
}

export function AchievementsSection({ username, isOwner, className }: Props) {
  const { data, isLoading } = useUserBadges(username);
  const equip = useEquipBadge(username);

  if (isLoading) {
    return (
      <section className={cn('mt-8', className)}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Conquistas
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-h-[10rem] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </section>
    );
  }

  if (!data?.badges.length) return null;

  return (
    <section className={cn('mt-8', className)}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Conquistas
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {data.badges.map((badge) => (
          <AchievementTile
            key={badge.slug}
            badge={badge}
            isOwner={isOwner}
            busy={equip.isPending}
            onEquip={() => {
              if (!isOwner || !badge.earned) return;
              equip.mutate(badge.isEquipped ? null : badge.id);
            }}
          />
        ))}
      </div>
    </section>
  );
}

function AchievementTile({
  badge,
  isOwner,
  busy,
  onEquip,
}: {
  badge: BadgeProgress;
  isOwner: boolean;
  busy: boolean;
  onEquip: () => void;
}) {
  const rarity = badge.rarityColor ?? '#A855F7';
  const unlocked = badge.earned;
  const pct = Math.min(
    100,
    Math.round((badge.progress.current / Math.max(badge.progress.target, 1)) * 100),
  );
  const fraction = `${badge.progress.current}/${badge.progress.target}`;

  return (
    <button
      type="button"
      disabled={!isOwner || !unlocked || busy}
      onClick={onEquip}
      className={cn(
        'relative flex min-h-[10rem] flex-col justify-between rounded-xl border p-[1.5rem] text-left transition',
        unlocked
          ? 'opacity-100 hover:brightness-110'
          : 'border-border/60 bg-muted/30 opacity-55',
        unlocked && badge.isEquipped && 'ring-2 ring-offset-2 ring-offset-background',
        isOwner && unlocked ? 'cursor-pointer' : 'cursor-default',
      )}
      style={
        unlocked
          ? {
              borderColor: `${rarity}80`,
              backgroundImage: `linear-gradient(165deg, ${rarity}22 0%, transparent 55%)`,
              backgroundColor: 'hsl(var(--card))',
              ...(badge.isEquipped ? { ['--tw-ring-color' as string]: rarity } : {}),
            }
          : undefined
      }
      title={
        unlocked
          ? isOwner
            ? badge.isEquipped
              ? 'Clique para desequipar'
              : 'Clique para equipar'
            : badge.name
          : badge.progress.hint
      }
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            'min-w-0 flex-1 pr-1 text-sm font-bold leading-snug',
            unlocked ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {badge.name}
        </p>
        {unlocked ? (
          <CheckCircle2
            className="h-5 w-5 flex-shrink-0"
            style={{ color: rarity }}
            aria-label="Conquistado"
          />
        ) : (
          <Lock className="h-5 w-5 flex-shrink-0 text-muted-foreground/70" aria-hidden />
        )}
      </div>

      <p
        className={cn(
          'mt-2 line-clamp-3 text-[0.75rem] leading-snug',
          unlocked ? 'text-muted-foreground' : 'text-muted-foreground/80',
        )}
      >
        {badge.description}
      </p>

      {badge.isEquipped && (
        <span
          className="mt-2 text-[0.65rem] font-bold uppercase tracking-wide"
          style={{ color: rarity }}
        >
          Equipado
        </span>
      )}

      <div className="mt-auto pt-4">
        <div className="mb-1.5 flex justify-end">
          <span className="text-[0.75rem] tabular-nums text-muted-foreground">{fraction}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted dark:bg-gray-800">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              unlocked ? '' : 'opacity-70',
            )}
            style={{
              width: `${pct}%`,
              backgroundColor: unlocked ? rarity : 'hsl(var(--muted-foreground) / 0.45)',
            }}
          />
        </div>
      </div>
    </button>
  );
}
