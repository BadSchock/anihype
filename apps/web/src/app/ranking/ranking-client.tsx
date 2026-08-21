'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@anihype/ui';
import { useAnimeRanking, useUserRanking } from '@/hooks/use-ranking';
import { EquippedBadgeChip } from '@/components/badges/equipped-badge-chip';
import { UserAvatar } from '@/components/user/user-avatar';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import type { AnimeRankingItem, UserRankingItem, UserRankingPeriod } from '@/types/api';

type Tab = 'animes' | 'membros';

const PERIODS: { id: UserRankingPeriod; label: string }[] = [
  { id: 'week', label: 'Essa semana' },
  { id: 'month', label: 'Esse mês' },
  { id: 'all', label: 'Todos os tempos' },
];

const PODIUM_STYLE = [
  'order-2 sm:order-1 border-slate-300/40',
  'order-1 sm:order-2 border-yellow-300/70 sm:-translate-y-3',
  'order-3 border-orange-400/50',
] as const;

/** Fallback ring until profile cosmetics exist — only podium places. */
const PODIUM_FRAME: Record<number, string> = {
  1: '#FBBF24',
  2: '#CBD5E1',
  3: '#FB923C',
};

const PODIUM_BACKDROP: Record<number, string> = {
  1: 'linear-gradient(160deg, rgba(251,191,36,0.35) 0%, rgba(15,17,21,0.95) 55%, rgba(15,17,21,1) 100%)',
  2: 'linear-gradient(160deg, rgba(203,213,225,0.28) 0%, rgba(15,17,21,0.95) 55%, rgba(15,17,21,1) 100%)',
  3: 'linear-gradient(160deg, rgba(251,146,60,0.30) 0%, rgba(15,17,21,0.95) 55%, rgba(15,17,21,1) 100%)',
};

export function RankingClient() {
  const [tab, setTab] = useState<Tab>('animes');
  const [period, setPeriod] = useState<UserRankingPeriod>('all');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Ranking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Os animes mais bem avaliados e os membros com mais Hype XP.
        </p>
      </header>

      <div className="mb-6 flex gap-2 border-b border-border">
        {(
          [
            { id: 'animes' as const, label: 'Animes' },
            { id: 'membros' as const, label: 'Membros' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-semibold transition-colors',
              tab === t.id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'animes' ? <AnimeRankingTab /> : <MembersRankingTab period={period} onPeriod={setPeriod} />}
    </div>
  );
}

function AnimeRankingTab() {
  const { data, isLoading } = useAnimeRanking(50);
  const items = data?.items ?? [];
  const top3 = items.slice(0, 3);
  const rest = items.slice(3);

  if (isLoading) return <RankingSkeleton />;

  if (!items.length) {
    return (
      <EmptyState message="Ainda não há animes com 10+ avaliações no Hypômetro." />
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
        {reorderPodium(top3).map((item, visualIdx) => (
          <AnimePodiumCard key={item.id} item={item} visualIdx={visualIdx} />
        ))}
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {rest.map((item) => (
          <li key={item.id}>
            <Link
              href={`/anime/${item.slug}`}
              className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50"
            >
              <span className="w-8 text-center text-sm font-bold tabular-nums text-muted-foreground">
                #{item.position}
              </span>
              <CoverThumb url={item.coverImageUrl} alt={item.titleRomaji} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {item.titleEnglish ?? item.titleRomaji}
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.ratingCount} avaliações
                </p>
              </div>
              <span className="text-sm font-bold tabular-nums text-foreground">
                {item.ratingAverage?.toFixed(1) ?? '—'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MembersRankingTab({
  period,
  onPeriod,
}: {
  period: UserRankingPeriod;
  onPeriod: (p: UserRankingPeriod) => void;
}) {
  const { user } = useAuthHydrated();
  const { data, isLoading } = useUserRanking(period);
  const items = data?.items ?? [];
  const top3 = items.slice(0, 3);
  const rest = items.slice(3);
  const me = data?.me;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPeriod(p.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-semibold transition',
              period === p.id
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && <RankingSkeleton />}

      {!isLoading && !items.length && (
        <EmptyState message="Ninguém gerou Hype XP neste período ainda." />
      )}

      {!isLoading && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
            {reorderPodium(top3).map((item, visualIdx) => (
              <UserPodiumCard key={item.userId} item={item} visualIdx={visualIdx} />
            ))}
          </div>

          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {rest.map((item) => (
              <MemberRow key={item.userId} item={item} />
            ))}
          </ul>
        </>
      )}

      {me && user && (
        <div className="fixed inset-x-0 bottom-16 z-40 border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur sm:bottom-4">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="w-8 text-center text-sm font-bold tabular-nums">#{me.position}</span>
            <UserAvatar name={user.displayName ?? user.username} avatarUrl={null} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Você</p>
              <p className="text-[11px] text-muted-foreground">{me.motivational}</p>
            </div>
            <span className="text-sm font-bold tabular-nums">{me.hypeXp} XP</span>
          </div>
        </div>
      )}
    </div>
  );
}

function reorderPodium<T>(items: T[]): T[] {
  if (items.length < 3) return items;
  // visual: silver, gold, bronze → indices 1, 0, 2
  return [items[1]!, items[0]!, items[2]!];
}

function AnimePodiumCard({ item, visualIdx }: { item: AnimeRankingItem; visualIdx: number }) {
  const title = item.titleEnglish ?? item.titleRomaji;
  return (
    <Link
      href={`/anime/${item.slug}`}
      className={cn(
        'flex flex-col items-center rounded-xl border p-4 text-center transition hover:brightness-110',
        PODIUM_STYLE[visualIdx],
      )}
    >
      <span className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        #{item.position}
      </span>
      <CoverThumb url={item.coverImageUrl} alt={title} large />
      <p className="mt-3 line-clamp-2 text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-lg font-black tabular-nums">{item.ratingAverage?.toFixed(1)}</p>
    </Link>
  );
}

function UserPodiumCard({ item, visualIdx }: { item: UserRankingItem; visualIdx: number }) {
  const displayName = item.displayName ?? item.username;
  const customBg = item.profileBackgroundUrl;
  const hasCustomBg = Boolean(customBg);
  const frameColor =
    item.profileFrameColor ?? PODIUM_FRAME[item.position] ?? null;
  const podiumBackdrop = PODIUM_BACKDROP[item.position];

  return (
    <Link
      href={`/u/${item.username}`}
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl border text-center shadow-lg transition hover:brightness-110',
        PODIUM_STYLE[visualIdx],
      )}
    >
      {/* Custom profile BG (V1.1) or medal wash fallback */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: hasCustomBg
            ? `url(${customBg})`
            : podiumBackdrop,
        }}
        aria-hidden
      />
      {/* Readability shield */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center gap-3 p-[1.5rem]">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          #{item.position}
        </span>
        <UserAvatar
          name={displayName}
          avatarUrl={item.avatarUrl}
          size="lg"
          frameColor={frameColor}
          className="h-[5rem] w-[5rem] text-2xl"
        />
        <div className="flex min-w-0 flex-col items-center gap-1">
          <p className="w-full truncate text-sm font-bold text-foreground">{displayName}</p>
          {item.equippedBadge && <EquippedBadgeChip badge={item.equippedBadge} />}
        </div>
        <p className="text-lg font-black tabular-nums text-foreground">{item.hypeXp} XP</p>
        {item.level?.displayName && (
          <p className="text-[11px] text-muted-foreground">{item.level.displayName}</p>
        )}
      </div>
    </Link>
  );
}

function MemberRow({ item }: { item: UserRankingItem }) {
  const displayName = item.displayName ?? item.username;

  return (
    <li>
      <Link
        href={`/u/${item.username}`}
        className="flex items-center gap-3 px-4 py-3 transition hover:bg-muted/50"
      >
        <span className="w-8 text-center text-sm font-bold tabular-nums text-muted-foreground">
          #{item.position}
        </span>
        <UserAvatar
          name={displayName}
          avatarUrl={item.avatarUrl}
          size="sm"
          frameColor={item.profileFrameColor}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-foreground">{displayName}</p>
            {item.equippedBadge && <EquippedBadgeChip badge={item.equippedBadge} />}
          </div>
          <p className="text-xs text-muted-foreground">
            {item.level?.displayName ?? 'Iniciante'}
          </p>
        </div>
        <span className="text-sm font-bold tabular-nums">{item.hypeXp} XP</span>
      </Link>
    </li>
  );
}

function CoverThumb({
  url,
  alt,
  large,
}: {
  url: string | null;
  alt: string;
  large?: boolean;
}) {
  const size = large ? 'h-28 w-20' : 'h-12 w-9';
  if (!url) {
    return <div className={cn(size, 'flex-shrink-0 rounded bg-muted')} />;
  }
  return (
    <div className={cn(size, 'relative flex-shrink-0 overflow-hidden rounded')}>
      <Image src={url} alt={alt} fill className="object-cover" sizes="80px" />
    </div>
  );
}

function RankingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
