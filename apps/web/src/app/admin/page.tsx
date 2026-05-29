'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useAuthStore } from '@/stores/auth.store';
import { EmptyState } from '@/components/ui/empty-state';
import { HighlightsAdmin } from './_components/highlights-admin';
import { AnimeAdminEditor } from './_components/anime-admin-editor';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

interface SyncResult {
  animeId: number;
  slug: string;
  episodesSynced: number;
  created: boolean;
}

interface SeasonSyncResult {
  season: string;
  seasonYear: number;
  airingOnly: boolean;
  totalFound: number;
  synced: number;
  created: number;
  updated: number;
  failed: number;
  results: SyncResult[];
  errors: Array<{ anilistId: number; title: string; error: string }>;
}

type AnimeSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';

function getCurrentSeason(): { season: AnimeSeason; seasonYear: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  if (month <= 3) return { season: 'WINTER', seasonYear: year };
  if (month <= 6) return { season: 'SPRING', seasonYear: year };
  if (month <= 9) return { season: 'SUMMER', seasonYear: year };
  return { season: 'FALL', seasonYear: year };
}

const SEASONS: AnimeSeason[] = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

export default function AdminPage() {
  const { authReady, isAuthenticated, user } = useAuthHydrated();
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();
  const [anilistId, setAnilistId] = useState('');
  const [malId, setMalId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const defaults = getCurrentSeason();
  const [season, setSeason] = useState<AnimeSeason>(defaults.season);
  const [seasonYear, setSeasonYear] = useState(String(defaults.seasonYear));
  const [airingOnly, setAiringOnly] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isSeasonSync, setIsSeasonSync] = useState(false);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [seasonResult, setSeasonResult] = useState<SeasonSyncResult | null>(null);
  const [error, setError] = useState('');
  const [cronTriggered, setCronTriggered] = useState<'daily' | 'weekly' | null>(null);

  const isAdmin = user?.roles.includes('ADMIN');

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated || !isAdmin) {
      router.replace('/');
    }
  }, [authReady, isAuthenticated, isAdmin, router]);

  if (!authReady || !isAuthenticated || !isAdmin) return null;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  async function syncAniList() {
    const id = parseInt(anilistId, 10);
    if (isNaN(id)) { setError('ID inválido'); return; }
    setSyncing(true); setError(''); setResults([]); setSeasonResult(null); setIsSeasonSync(false);
    try {
      const res = await fetch(`${API}/sync/anilist`, {
        method: 'POST', headers, body: JSON.stringify({ anilistId: id }),
      });
      const json = await res.json() as { data?: SyncResult };
      if (json.data) setResults([json.data]);
    } catch { setError('Sync falhou'); }
    setSyncing(false);
  }

  async function syncMal() {
    const id = parseInt(malId, 10);
    if (isNaN(id)) { setError('ID inválido'); return; }
    setSyncing(true); setError(''); setResults([]); setSeasonResult(null); setIsSeasonSync(false);
    try {
      const res = await fetch(`${API}/sync/mal`, {
        method: 'POST', headers, body: JSON.stringify({ malId: id }),
      });
      const json = await res.json() as { data?: SyncResult };
      if (json.data) setResults([json.data]);
    } catch { setError('Sync falhou'); }
    setSyncing(false);
  }

  async function syncSearch() {
    if (!searchTerm.trim()) { setError('Informe um título'); return; }
    setSyncing(true); setError(''); setResults([]); setSeasonResult(null); setIsSeasonSync(false);
    try {
      const res = await fetch(`${API}/sync/search`, {
        method: 'POST', headers, body: JSON.stringify({ search: searchTerm }),
      });
      const json = await res.json() as { data?: SyncResult[] };
      if (json.data) setResults(json.data);
    } catch { setError('Sync falhou'); }
    setSyncing(false);
  }

  async function triggerCron(type: 'daily' | 'weekly') {
    setCronTriggered(null);
    const route = type === 'daily' ? 'cron/trigger/daily' : 'cron/trigger/weekly';
    try {
      await fetch(`${API}/sync/${route}`, { method: 'POST', headers });
      setCronTriggered(type);
    } catch {
      setError('Falha ao disparar o cron');
    }
  }

  async function syncSeason() {
    const year = parseInt(seasonYear, 10);
    if (isNaN(year)) { setError('Ano inválido'); return; }
    setSyncing(true); setError(''); setResults([]); setSeasonResult(null); setIsSeasonSync(true);
    try {
      const res = await fetch(`${API}/sync/season`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ season, seasonYear: year, airingOnly }),
      });
      const json = await res.json() as { data?: SeasonSyncResult; message?: string };
      if (!res.ok) {
        setError(json.message ?? 'Import da temporada falhou');
        return;
      }
      if (json.data) {
        setSeasonResult(json.data);
        setResults(json.data.results);
      }
    } catch {
      setError('Import da temporada falhou — pode levar vários minutos, tente de novo');
    }
    setSyncing(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold text-foreground">
        Painel Admin
        <span className="ml-3 text-sm font-normal text-muted-foreground">
          logado como {user?.username}
        </span>
      </h1>

      <div className="flex flex-col gap-6">
        <AnimeAdminEditor />
        <HighlightsAdmin />

        {/* Cron automático */}
        <section className="rounded-xl border border-green-500/20 bg-muted p-5">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Sincronização automática</h2>
            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-400">
              ativo
            </span>
          </div>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
            <div className="rounded-lg bg-background px-3 py-2">
              <p className="font-medium text-foreground">Re-sync diário</p>
              <p>Todo dia às 04:00 (BRT) — atualiza episódios e scores dos animes em exibição.</p>
            </div>
            <div className="rounded-lg bg-background px-3 py-2">
              <p className="font-medium text-foreground">Sync semanal completo</p>
              <p>Todo domingo às 03:00 (BRT) — importa toda a temporada, incluindo finalizados e OVAs.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => triggerCron('daily')}
              disabled={syncing}
              className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              ▶ Disparar re-sync diário agora
            </button>
            <button
              onClick={() => triggerCron('weekly')}
              disabled={syncing}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600 disabled:opacity-50 transition-colors"
            >
              ▶ Disparar sync semanal agora
            </button>
          </div>
          {cronTriggered && (
            <p className="mt-3 text-xs text-green-400">
              ✓ {cronTriggered === 'daily' ? 'Re-sync diário' : 'Sync semanal'} disparado em background — verifique os logs da API.
            </p>
          )}
        </section>

        {/* Import temporada inteira */}
        <section className="rounded-xl border border-purple-500/30 bg-muted p-5">
          <h2 className="mb-1 text-base font-semibold text-foreground">
            Importar temporada inteira
          </h2>
          <p className="mb-4 text-xs text-muted-foreground">
            Busca todos os animes no AniList e importa um a um (pode levar alguns minutos).
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Temporada</span>
              <select
                value={season}
                onChange={(e) => setSeason(e.target.value as AnimeSeason)}
                disabled={syncing}
                className="rounded-lg bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-purple-500"
              >
                {SEASONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Ano</span>
              <input
                value={seasonYear}
                onChange={(e) => setSeasonYear(e.target.value)}
                disabled={syncing}
                className="w-24 rounded-lg bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-purple-500"
              />
            </label>
            <label className="flex items-center gap-2 pb-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={airingOnly}
                onChange={(e) => setAiringOnly(e.target.checked)}
                disabled={syncing}
                className="rounded"
              />
              Só em exibição
            </label>
            <button
              onClick={syncSeason}
              disabled={syncing}
              className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-foreground hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Importando...' : 'Importar temporada'}
            </button>
          </div>
        </section>

        {/* Sync por AniList ID */}
        <section className="rounded-xl bg-muted p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">Sync por AniList ID</h2>
          <div className="flex gap-2">
            <input
              value={anilistId}
              onChange={(e) => setAnilistId(e.target.value)}
              placeholder="Ex: 20"
              className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={syncAniList}
              disabled={syncing}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-foreground hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Sincronizando...' : 'Sync'}
            </button>
          </div>
        </section>

        {/* Sync por MAL ID */}
        <section className="rounded-xl bg-muted p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">Sync por MAL ID (Jikan)</h2>
          <div className="flex gap-2">
            <input
              value={malId}
              onChange={(e) => setMalId(e.target.value)}
              placeholder="Ex: 1535"
              className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={syncMal}
              disabled={syncing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-foreground hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Sincronizando...' : 'Sync'}
            </button>
          </div>
        </section>

        {/* Sync por busca */}
        <section className="rounded-xl bg-muted p-5">
          <h2 className="mb-3 text-base font-semibold text-foreground">Buscar e Sincronizar (AniList)</h2>
          <div className="flex gap-2">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: Attack on Titan"
              className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm text-foreground placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={syncSearch}
              disabled={syncing}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-foreground hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Buscando...' : 'Buscar'}
            </button>
          </div>
        </section>

        {/* Resultados */}
        {error && (
          <p className="rounded-xl bg-red-500/10 p-4 text-sm text-red-400">{error}</p>
        )}

        {syncing && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Sincronizando com a API externa, aguarde...
            {isSeasonSync && (
              <span className="mt-1 block text-xs">
                Import de temporada pode levar 5–15 minutos conforme a quantidade de títulos.
              </span>
            )}
          </div>
        )}

        {!syncing && seasonResult && (
          <section className="rounded-xl bg-muted p-5">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Temporada {seasonResult.season} {seasonResult.seasonYear}
            </h2>
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-lg bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Encontrados</p>
                <p className="font-semibold text-foreground">{seasonResult.totalFound}</p>
              </div>
              <div className="rounded-lg bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Importados</p>
                <p className="font-semibold text-green-400">{seasonResult.synced}</p>
              </div>
              <div className="rounded-lg bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Criados / Atualizados</p>
                <p className="font-semibold text-foreground">
                  {seasonResult.created} / {seasonResult.updated}
                </p>
              </div>
              <div className="rounded-lg bg-background px-3 py-2">
                <p className="text-xs text-muted-foreground">Falhas</p>
                <p className={`font-semibold ${seasonResult.failed ? 'text-red-400' : 'text-foreground'}`}>
                  {seasonResult.failed}
                </p>
              </div>
            </div>
            {seasonResult.errors.length > 0 && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3">
                <p className="mb-2 text-xs font-medium text-red-400">Erros</p>
                <ul className="flex flex-col gap-1 text-xs text-red-300">
                  {seasonResult.errors.slice(0, 10).map((e) => (
                    <li key={e.anilistId}>{e.title}: {e.error}</li>
                  ))}
                  {seasonResult.errors.length > 10 && (
                    <li>… e mais {seasonResult.errors.length - 10}</li>
                  )}
                </ul>
              </div>
            )}
          </section>
        )}

        {!syncing && results.length > 0 && (
          <section className="rounded-xl bg-muted p-5">
            <h2 className="mb-3 text-base font-semibold text-foreground">Resultados</h2>
            <div className="flex flex-col gap-2">
              {results.map((r) => (
                <div key={r.animeId} className="flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{r.slug}</p>
                    <p className="text-xs text-muted-foreground">
                      ID {r.animeId} · {r.episodesSynced} episódios · {r.created ? 'criado' : 'atualizado'}
                    </p>
                  </div>
                  <a
                    href={`/anime/${r.slug}`}
                    className="text-xs text-purple-400 hover:underline"
                  >
                    Ver →
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {!syncing && results.length === 0 && !seasonResult && !error && (
          <EmptyState
            title="Pronto para sincronizar"
            description="Use os campos acima para importar animes das APIs externas."
          />
        )}
      </div>
    </div>
  );
}
