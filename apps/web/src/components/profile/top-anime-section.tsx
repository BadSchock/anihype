'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@anihype/ui';
import { useUserTopAnime, useSetTopAnime } from '@/hooks/use-top-anime';
import { useAnimeSearch } from '@/hooks/use-anime';
import type { TopAnimeEntry } from '@/types/api';

const POSITIONS = [1, 2, 3, 4] as const;

// ─── Slot vazio ─────────────────────────────────────────────────────────────

function EmptySlot({
  position,
  isOwner,
  onEdit,
}: {
  position: number;
  isOwner: boolean;
  onEdit?: () => void;
}) {
  if (!isOwner) {
    return (
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
          <span className="text-2xl text-muted-foreground/40">·</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
            #{position}
          </span>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onEdit}
      className="group relative aspect-[2/3] overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:border-purple-500/60 hover:bg-purple-500/5"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="text-2xl text-muted-foreground/40 transition-colors group-hover:text-purple-400/60">
          +
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
          #{position}
        </span>
        <span className="mt-1 rounded-md bg-purple-600 px-2 py-1 text-[10px] font-semibold text-white">
          Editar
        </span>
      </div>
    </button>
  );
}

// ─── Card preenchido ─────────────────────────────────────────────────────────

function AnimeCard({
  entry,
  isOwner,
  onEdit,
}: {
  entry: TopAnimeEntry;
  isOwner: boolean;
  onEdit?: () => void;
}) {
  const title = entry.anime.titleEnglish ?? entry.anime.titleRomaji;

  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-border">
      {entry.anime.coverImageUrl ? (
        <Image
          src={entry.anime.coverImageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 40vw, 160px"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-white drop-shadow">
          {title}
        </p>
        <p className="mt-0.5 text-[10px] text-white/60">#{entry.position}</p>
      </div>

      {isOwner ? (
        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/55 p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-md bg-purple-600 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-purple-500"
          >
            Editar
          </button>
          <Link
            href={`/anime/${entry.anime.slug}`}
            className="rounded-md bg-white/15 px-2 py-1.5 text-[10px] font-semibold text-white hover:bg-white/25"
          >
            Ver
          </Link>
        </div>
      ) : (
        <Link href={`/anime/${entry.anime.slug}`} className="absolute inset-0" aria-label={title} />
      )}
    </div>
  );
}

// ─── Modal de seleção ────────────────────────────────────────────────────────

function AnimePickerModal({
  onSelect,
  onClose,
  excludeIds,
  current,
}: {
  onSelect: (id: number, title: string) => void;
  onClose: () => void;
  excludeIds: number[];
  current: { id: number; title: string } | null;
}) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useAnimeSearch(q);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal
      aria-label="Escolher anime para o Top 4"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex w-full max-w-md flex-col overflow-hidden border border-border bg-background shadow-2xl',
          'mb-[calc(4rem+env(safe-area-inset-bottom,0px))] h-[min(28rem,calc(100dvh-5.5rem-env(safe-area-inset-bottom,0px)))] rounded-t-2xl',
          'sm:mb-0 sm:h-auto sm:max-h-[min(32rem,85dvh)] sm:rounded-2xl',
        )}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <h3 className="text-base font-bold text-foreground">Escolher anime</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>
        {current && (
          <div className="mx-5 mt-4 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-300">
              Selecionado
            </p>
            <p className="truncate text-sm font-medium text-foreground">{current.title}</p>
          </div>
        )}
        <div className="px-5 pb-3 pt-4">
          <input
            autoFocus
            type="search"
            enterKeyHint="search"
            placeholder="Buscar anime..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-xl bg-muted px-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-purple-500"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-4 sm:max-h-64 sm:flex-none">
          {isLoading && (
            <p className="py-4 text-center text-sm text-muted-foreground">Buscando...</p>
          )}
          {!isLoading && q.length >= 2 && (!data || data.length === 0) && (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum resultado</p>
          )}
          {!isLoading && q.length < 2 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Digite ao menos 2 caracteres
            </p>
          )}
          {data?.map((anime: import('@/types/api').AnimeListItem) => {
            const title = anime.titleEnglish ?? anime.titleRomaji;
            const isCurrent = current?.id === anime.id;
            const excluded = excludeIds.includes(anime.id);
            return (
              <button
                key={anime.id}
                type="button"
                disabled={excluded}
                onClick={() => onSelect(anime.id, title)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                  excluded
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:bg-muted',
                  isCurrent && 'bg-purple-500/10',
                )}
              >
                {anime.coverImageUrl && (
                  <Image
                    src={anime.coverImageUrl}
                    alt=""
                    width={32}
                    height={48}
                    className="shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground">
                    {isCurrent ? 'Selecionado na capa' : anime.seasonYear ?? ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────

interface Props {
  username: string;
  isOwner: boolean;
}

export function TopAnimeSection({ username, isOwner }: Props) {
  const { data: entries = [], isLoading } = useUserTopAnime(username);
  const { mutateAsync: save, isPending } = useSetTopAnime(username);

  const [pickingPosition, setPickingPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickingEntry =
    pickingPosition == null ? null : entries.find((entry) => entry.position === pickingPosition) ?? null;

  async function handlePickAnime(animeId: number) {
    if (pickingPosition == null || isPending) return;
    if (pickingEntry?.anime.id === animeId) {
      setPickingPosition(null);
      return;
    }

    const items = entries
      .filter((entry) => entry.position !== pickingPosition)
      .map((entry) => ({ animeId: entry.anime.id, position: entry.position }));
    items.push({ animeId, position: pickingPosition });

    setError(null);
    try {
      await save({ items });
      setPickingPosition(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    }
  }

  const slots = POSITIONS.map((position) => entries.find((entry) => entry.position === position) ?? null);
  const isEmpty = !isLoading && entries.length === 0;

  if (isEmpty && !isOwner) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Top 4 favoritos
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {POSITIONS.map((position) => (
            <div key={position} className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {slots.map((entry, index) => {
            const position = POSITIONS[index]!;
            return entry ? (
              <AnimeCard
                key={position}
                entry={entry}
                isOwner={isOwner}
                onEdit={() => setPickingPosition(position)}
              />
            ) : (
              <EmptySlot
                key={position}
                position={position}
                isOwner={isOwner}
                onEdit={() => setPickingPosition(position)}
              />
            );
          })}
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {pickingPosition != null && (
        <AnimePickerModal
          current={
            pickingEntry
              ? {
                  id: pickingEntry.anime.id,
                  title: pickingEntry.anime.titleEnglish ?? pickingEntry.anime.titleRomaji,
                }
              : null
          }
          excludeIds={entries
            .filter((entry) => entry.position !== pickingPosition)
            .map((entry) => entry.anime.id)}
          onSelect={(animeId) => void handlePickAnime(animeId)}
          onClose={() => {
            if (!isPending) setPickingPosition(null);
          }}
        />
      )}
    </section>
  );
}
