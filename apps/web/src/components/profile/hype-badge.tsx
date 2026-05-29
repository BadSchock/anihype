'use client';

import { cn } from '@anihype/ui';
import { useUserHype } from '@/hooks/use-hype';

interface Props {
  username: string;
  className?: string;
}

const TIER_COLORS: Record<number, string> = {
  1: 'from-slate-500/20 to-slate-600/10 text-slate-300 border-slate-500/30',
  2: 'from-blue-500/20 to-blue-600/10 text-blue-300 border-blue-500/30',
  3: 'from-purple-500/20 to-purple-600/10 text-purple-300 border-purple-500/30',
  4: 'from-orange-500/20 to-orange-600/10 text-orange-300 border-orange-500/30',
  5: 'from-yellow-500/20 to-amber-600/10 text-yellow-300 border-yellow-500/30',
};

export function HypeBadge({ username, className }: Props) {
  const { data, isLoading } = useUserHype(username);

  if (isLoading) {
    return <div className={cn('h-16 animate-pulse rounded-xl bg-muted', className)} aria-hidden />;
  }

  if (!data) return null;

  const tier = data.level?.tierOrder ?? 1;
  const tierStyle = TIER_COLORS[tier] ?? TIER_COLORS[1];
  const progress =
    data.nextLevel && data.nextLevel.minXp > (data.level?.minXp ?? 0)
      ? Math.min(
          100,
          ((data.hypeXp - (data.level?.minXp ?? 0)) /
            (data.nextLevel.minXp - (data.level?.minXp ?? 0))) *
            100,
        )
      : 100;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border bg-gradient-to-br p-4',
        tierStyle,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70">Hype XP</p>
          <p className="mt-0.5 text-2xl font-black tabular-nums">{data.hypeXp.toLocaleString('pt-BR')}</p>
        </div>
        <div className="text-right">
          <p className="text-lg leading-none">⚡</p>
          <p className="mt-1 text-sm font-bold">{data.level?.displayName ?? 'Iniciante'}</p>
        </div>
      </div>

      {data.nextLevel && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[10px] opacity-70">
            <span>Próximo: {data.nextLevel.displayName}</span>
            <span>{data.nextLevel.xpNeeded} XP</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-black/20">
            <div
              className="h-full rounded-full bg-current transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {!data.nextLevel && (
        <p className="mt-2 text-xs font-medium opacity-80">Nível máximo alcançado 👑</p>
      )}
    </div>
  );
}
