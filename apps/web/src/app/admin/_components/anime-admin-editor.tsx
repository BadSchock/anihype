'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { getAnimeAdmin, updateAnimeAdmin, updateEpisodeAdmin } from '@/services/api';
import type { AnimeAdminData } from '@/types/api';

interface StreamingRow {
  platformName: string;
  url: string;
  regionCode: string;
}

function toLocalDatetime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AnimeAdminEditor() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const [slugInput, setSlugInput] = useState('');
  const [data, setData] = useState<AnimeAdminData | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [streamingRows, setStreamingRows] = useState<StreamingRow[]>([]);
  const [episodeEdits, setEpisodeEdits] = useState<Record<number, { airTimeUtc: string; title: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function applyData(anime: AnimeAdminData) {
    setData(anime);
    setCoverImageUrl(anime.coverImageUrl ?? '');
    setBannerImageUrl(anime.bannerImageUrl ?? '');
    setTrailerUrl(anime.trailerUrl ?? '');
    setIsLocked(anime.isLocked);
    setStreamingRows(
      anime.streamingLinks.map((l) => ({
        platformName: l.platform.name,
        url: l.url,
        regionCode: l.regionCode ?? '',
      })),
    );
    const edits: Record<number, { airTimeUtc: string; title: string }> = {};
    for (const ep of anime.episodes) {
      edits[ep.number] = {
        airTimeUtc: toLocalDatetime(ep.airTimeUtc),
        title: ep.title ?? '',
      };
    }
    setEpisodeEdits(edits);
  }

  async function handleLoad(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken || !slugInput.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const anime = await getAnimeAdmin(slugInput.trim(), accessToken);
      applyData(anime);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Anime não encontrado');
      setData(null);
    }
    setLoading(false);
  }

  async function handleSaveAnime() {
    if (!accessToken || !data) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateAnimeAdmin(
        data.slug,
        {
          coverImageUrl: coverImageUrl.trim() || null,
          bannerImageUrl: bannerImageUrl.trim() || null,
          trailerUrl: trailerUrl.trim() || null,
          isLocked,
          streamingLinks: streamingRows
            .filter((r) => r.platformName.trim() && r.url.trim())
            .map((r) => ({
              platformName: r.platformName.trim(),
              url: r.url.trim(),
              regionCode: r.regionCode.trim() || undefined,
            })),
        },
        accessToken,
      );
      applyData(updated);
      setSuccess('Metadados salvos.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    }
    setSaving(false);
  }

  async function handleSaveEpisode(number: number) {
    if (!accessToken || !data) return;
    const edit = episodeEdits[number];
    if (!edit) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const airTimeUtc = edit.airTimeUtc ? new Date(edit.airTimeUtc).toISOString() : null;
      const updated = await updateEpisodeAdmin(
        data.slug,
        number,
        {
          airTimeUtc,
          title: edit.title.trim() || null,
        },
        accessToken,
      );
      applyData(updated);
      setSuccess(`Episódio ${number} atualizado.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar episódio');
    }
    setSaving(false);
  }

  function addStreamingRow() {
    setStreamingRows((rows) => [...rows, { platformName: '', url: '', regionCode: 'BR' }]);
  }

  function removeStreamingRow(index: number) {
    setStreamingRows((rows) => rows.filter((_, i) => i !== index));
  }

  return (
    <section className="rounded-xl border border-amber-500/20 bg-muted/50 p-5">
      <h2 className="mb-1 text-base font-semibold text-foreground">Editar anime</h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Corrija capa, banner, trailer, links de streaming e horários quando o sync vier incompleto.
        Marque &quot;Proteger do sync&quot; para manter capa, links e horários manuais — o sync diário não sobrescreve esses campos.
      </p>

      <form onSubmit={handleLoad} className="mb-4 flex gap-2">
        <input
          value={slugInput}
          onChange={(e) => setSlugInput(e.target.value)}
          placeholder="Slug do anime (ex: shingeki-no-kyojin)"
          className="flex-1 rounded-lg bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
        >
          {loading ? 'Carregando...' : 'Carregar'}
        </button>
      </form>

      {data && (
        <div className="flex flex-col gap-5">
          <div className="rounded-lg bg-background/60 px-3 py-2 text-sm">
            <span className="font-medium text-foreground">
              {data.titleEnglish ?? data.titleRomaji}
            </span>
            <span className="ml-2 text-muted-foreground">/{data.slug}</span>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="rounded"
            />
            Proteger do sync (capa, banner, trailer, streaming e horários de episódio)
          </label>

          <div className="grid gap-3 sm:grid-cols-1">
            <Field label="Capa (URL)" value={coverImageUrl} onChange={setCoverImageUrl} />
            <Field label="Banner (URL)" value={bannerImageUrl} onChange={setBannerImageUrl} />
            <Field label="Trailer (URL YouTube)" value={trailerUrl} onChange={setTrailerUrl} />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Onde assistir</p>
              <button
                type="button"
                onClick={addStreamingRow}
                className="text-xs text-amber-400 hover:underline"
              >
                + Plataforma
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {streamingRows.map((row, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
                  <input
                    value={row.platformName}
                    onChange={(e) => {
                      const next = [...streamingRows];
                      next[i] = { ...row, platformName: e.target.value };
                      setStreamingRows(next);
                    }}
                    placeholder="Plataforma"
                    className="rounded-lg bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <input
                    value={row.url}
                    onChange={(e) => {
                      const next = [...streamingRows];
                      next[i] = { ...row, url: e.target.value };
                      setStreamingRows(next);
                    }}
                    placeholder="URL"
                    className="rounded-lg bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <input
                    value={row.regionCode}
                    onChange={(e) => {
                      const next = [...streamingRows];
                      next[i] = { ...row, regionCode: e.target.value };
                      setStreamingRows(next);
                    }}
                    placeholder="BR"
                    className="w-16 rounded-lg bg-background px-2 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeStreamingRow(i)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))}
              {streamingRows.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum link — adicione plataformas manualmente.</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveAnime}
            disabled={saving}
            className="w-fit rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar metadados'}
          </button>

          {data.episodes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">Episódios (horário local)</p>
              <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Ep</th>
                      <th className="px-3 py-2">Título</th>
                      <th className="px-3 py-2">Exibição</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.episodes.map((ep) => (
                      <tr key={ep.id} className="border-t border-border/50">
                        <td className="px-3 py-2 font-medium">{ep.number}</td>
                        <td className="px-3 py-2">
                          <input
                            value={episodeEdits[ep.number]?.title ?? ''}
                            onChange={(e) =>
                              setEpisodeEdits((prev) => ({
                                ...prev,
                                [ep.number]: {
                                  ...prev[ep.number]!,
                                  title: e.target.value,
                                },
                              }))
                            }
                            className="w-full min-w-[120px] rounded bg-background px-2 py-1 outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="datetime-local"
                            value={episodeEdits[ep.number]?.airTimeUtc ?? ''}
                            onChange={(e) =>
                              setEpisodeEdits((prev) => ({
                                ...prev,
                                [ep.number]: {
                                  ...prev[ep.number]!,
                                  airTimeUtc: e.target.value,
                                },
                              }))
                            }
                            className="rounded bg-background px-2 py-1 outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleSaveEpisode(ep.number)}
                            disabled={saving}
                            className="text-amber-400 hover:underline disabled:opacity-50"
                          >
                            Salvar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {success && <p className="mt-3 text-sm text-green-400">{success}</p>}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-amber-500"
      />
    </label>
  );
}
