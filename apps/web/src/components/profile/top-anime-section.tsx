'use client';

import { useState } from 'react';
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
  editable,
  onClick,
}: {
  position: number;
  editable: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role={editable ? 'button' : undefined}
      tabIndex={editable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'group relative aspect-[2/3] overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors',
        editable && 'cursor-pointer hover:border-purple-500/60 hover:bg-purple-500/5',
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
        <span className="text-2xl text-muted-foreground/40 transition-colors group-hover:text-purple-400/60">
          {editable ? '+' : '·'}
        </span>
        <span className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest">
          #{position}
        </span>
      </div>
    </div>
  );
}

// ─── Card preenchido ─────────────────────────────────────────────────────────

function AnimeCard({
  entry,
  editable,
  onRemove,
}: {
  entry: TopAnimeEntry;
  editable: boolean;
  onRemove?: () => void;
}) {
  const title = entry.anime.titleEnglish ?? entry.anime.titleRomaji;
  return (
    <div className="group relative aspect-[2/3] overflow-hidden rounded-xl border border-border">
      <Link href={`/anime/${entry.anime.slug}`} tabIndex={-1}>
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
      </Link>
      {editable && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onRemove?.();
          }}
          aria-label="Remover do Top 4"
          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}

// ─── Modal de seleção ────────────────────────────────────────────────────────

function AnimePickerModal({
  onSelect,
  onClose,
  excludeIds,
}: {
  onSelect: (id: number, title: string) => void;
  onClose: () => void;
  excludeIds: number[];
}) {
  const [q, setQ] = useState('');
  const { data, isLoading } = useAnimeSearch(q);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal
      aria-label="Escolher anime para o Top 4"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl border border-border bg-background p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-foreground">Escolher anime</h3>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <input
          autoFocus
          type="text"
          placeholder="Buscar anime..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-3 w-full rounded-xl bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-purple-500"
        />
        <div className="max-h-64 overflow-y-auto">
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
            const excluded = excludeIds.includes(anime.id);
            return (
              <button
                key={anime.id}
                type="button"
                disabled={excluded}
                onClick={() => onSelect(anime.id, anime.titleEnglish ?? anime.titleRomaji)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                  excluded
                    ? 'cursor-not-allowed opacity-40'
                    : 'hover:bg-muted',
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
                  <p className="truncate text-sm font-medium text-foreground">
                    {anime.titleEnglish ?? anime.titleRomaji}
                  </p>
                  {anime.seasonYear && (
                    <p className="text-xs text-muted-foreground">{anime.seasonYear}</p>
                  )}
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

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ position: number; animeId: number; title: string }[]>([]);
  const [pickingPosition, setPickingPosition] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startEdit() {
    setDraft(
      entries.map((e) => ({
        position: e.position,
        animeId: e.anime.id,
        title: e.anime.titleEnglish ?? e.anime.titleRomaji,
      })),
    );
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraft([]);
    setError(null);
  }

  function removeFromDraft(position: number) {
    setDraft((prev) => prev.filter((d) => d.position !== position));
  }

  function handlePickAnime(animeId: number, title: string) {
    if (pickingPosition === null) return;
    setDraft((prev) => {
      const without = prev.filter((d) => d.position !== pickingPosition);
      return [...without, { position: pickingPosition, animeId, title }].sort(
        (a, b) => a.position - b.position,
      );
    });
    setPickingPosition(null);
  }

  async function handleSave() {
    setError(null);
    try {
      await save({ items: draft.map(({ animeId, position }) => ({ animeId, position })) });
      setEditing(false);
      setDraft([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    }
  }

  const editable = editing && isOwner;
  const currentEntries = editable
    ? POSITIONS.map((pos) => {
        const d = draft.find((x) => x.position === pos);
        return d
          ? ({ position: pos, anime: { id: d.animeId, slug: '', titleRomaji: d.title, titleEnglish: null, coverImageUrl: null, status: 'AIRING' as const } } satisfies TopAnimeEntry)
          : null;
      })
    : POSITIONS.map((pos) => entries.find((e) => e.position === pos) ?? null);

  const isEmpty = !isLoading && entries.length === 0 && !editing;

  if (isEmpty && !isOwner) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
          Top 4 favoritos
        </h2>
        {isOwner && !editing && (
          <button
            type="button"
            onClick={startEdit}
            className="text-xs text-purple-400 hover:underline"
          >
            {entries.length > 0 ? 'Editar' : '+ Adicionar'}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-4 gap-2">
          {POSITIONS.map((p) => (
            <div key={p} className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {currentEntries.map((entry, i) => {
            const pos = POSITIONS[i]!;
            return entry ? (
              <AnimeCard
                key={entry.position}
                entry={entry}
                editable={editable}
                onRemove={() => removeFromDraft(pos)}
              />
            ) : (
              <EmptySlot
                key={pos}
                position={pos}
                editable={editable}
                onClick={() => setPickingPosition(pos)}
              />
            );
          })}
        </div>
      )}

      {editing && (
        <div className="mt-3 flex flex-col gap-2">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 rounded-xl bg-purple-600 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Salvando...' : 'Salvar Top 4'}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-xl bg-muted px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {pickingPosition !== null && (
        <AnimePickerModal
          excludeIds={draft.map((d) => d.animeId)}
          onSelect={handlePickAnime}
          onClose={() => setPickingPosition(null)}
        />
      )}
    </section>
  );
}
