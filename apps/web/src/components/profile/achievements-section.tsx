'use client';

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
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
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
  const color = badge.rarityColor ?? '#A855F7';
  const pct = Math.min(100, Math.round((badge.progress.current / badge.progress.target) * 100));

  return (
    <button
      type="button"
      disabled={!isOwner || !badge.earned || busy}
      onClick={onEquip}
      className={cn(
        'relative flex flex-col rounded-xl border p-3 text-left transition',
        badge.earned
          ? 'bg-card hover:border-foreground/20'
          : 'bg-muted/40 opacity-80',
        badge.isEquipped && 'ring-2 ring-offset-2 ring-offset-background',
        isOwner && badge.earned && 'cursor-pointer',
        (!isOwner || !badge.earned) && 'cursor-default',
      )}
      style={{
        borderColor: badge.earned ? `${color}55` : undefined,
        ...(badge.isEquipped ? { ['--tw-ring-color' as string]: color } : {}),
      }}
      title={
        badge.earned
          ? isOwner
            ? badge.isEquipped
              ? 'Clique para desequipar'
              : 'Clique para equipar'
            : badge.name
          : badge.progress.hint
      }
    >
      {!badge.earned && (
        <span className="absolute right-2 top-2 text-xs text-muted-foreground" aria-hidden>
          🔒
        </span>
      )}
      {badge.isEquipped && (
        <span
          className="absolute right-2 top-2 text-[10px] font-bold uppercase tracking-wide"
          style={{ color }}
        >
          Equipado
        </span>
      )}

      <p className="pr-6 text-sm font-bold text-foreground">{badge.name}</p>
      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
        {badge.description}
      </p>

      <div className="mt-auto pt-3">
        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
          <span>{badge.progress.hint}</span>
          <span>
            {badge.progress.current}/{badge.progress.target}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </button>
  );
}
