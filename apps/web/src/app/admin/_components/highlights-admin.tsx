'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { createHighlight, deleteHighlight, getHighlights } from '@/services/api';
import type { SeasonalHighlight } from '@/types/api';

export function HighlightsAdmin() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [highlights, setHighlights] = useState<SeasonalHighlight[]>([]);
  const [animeId, setAnimeId] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!accessToken) return;
    try {
      const data = await getHighlights(accessToken);
      setHighlights(data);
    } catch {
      setError('Não foi possível carregar destaques.');
    }
  }

  useEffect(() => {
    void load();
  }, [accessToken]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const id = parseInt(animeId, 10);
    if (isNaN(id)) {
      setError('ID do anime inválido');
      return;
    }
    setLoading(true);
    try {
      await createHighlight(
        {
          animeId: id,
          title: title.trim() || undefined,
          subtitle: subtitle.trim() || undefined,
        },
        accessToken ?? undefined,
      );
      setAnimeId('');
      setTitle('');
      setSubtitle('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar destaque');
    }
    setLoading(false);
  }

  async function handleDelete(id: number) {
    if (!accessToken) return;
    setLoading(true);
    try {
      await deleteHighlight(id, accessToken);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover');
    }
    setLoading(false);
  }

  return (
    <section className="rounded-xl border border-purple-500/20 bg-muted/50 p-5">
      <h2 className="mb-1 text-base font-semibold text-foreground">Destaque da home (hero)</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Crie um destaque usando o ID interno do anime (visível nos resultados de sync abaixo).
      </p>

      <form onSubmit={handleCreate} className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Anime ID</label>
          <input
            value={animeId}
            onChange={(e) => setAnimeId(e.target.value)}
            placeholder="ex: 42"
            className="input-base w-28"
            required
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-xs text-muted-foreground">Título (opcional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título do hero"
            className="input-base w-full"
          />
        </div>
        <div className="flex-[2]">
          <label className="mb-1 block text-xs text-muted-foreground">Subtítulo (opcional)</label>
          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Sinopse curta"
            className="input-base w-full"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary px-4 py-2 text-sm">
          {loading ? 'Salvando...' : 'Criar destaque'}
        </button>
      </form>

      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {highlights.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum destaque configurado — a home usa o hero padrão.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {highlights.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between gap-3 rounded-lg bg-background px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {h.title ?? h.anime.titleEnglish ?? h.anime.titleRomaji}
                </p>
                <p className="text-xs text-muted-foreground">
                  ID {h.animeId} · {h.anime.slug} · {h.published ? 'publicado' : 'rascunho'}
                </p>
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDelete(h.id)}
                className="shrink-0 text-xs text-red-400 hover:underline disabled:opacity-50"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
