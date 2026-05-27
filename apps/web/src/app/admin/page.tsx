'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { EmptyState } from '@/components/ui/empty-state';

const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

interface SyncResult {
  animeId: number;
  slug: string;
  episodesSynced: number;
  created: boolean;
}

export default function AdminPage() {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const router = useRouter();
  const [anilistId, setAnilistId] = useState('');
  const [malId, setMalId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [results, setResults] = useState<SyncResult[]>([]);
  const [error, setError] = useState('');

  const isAdmin = user?.roles.includes('ADMIN');

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.replace('/');
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) return null;

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
  };

  async function syncAniList() {
    const id = parseInt(anilistId, 10);
    if (isNaN(id)) { setError('ID inválido'); return; }
    setSyncing(true); setError(''); setResults([]);
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
    setSyncing(true); setError(''); setResults([]);
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
    setSyncing(true); setError(''); setResults([]);
    try {
      const res = await fetch(`${API}/sync/search`, {
        method: 'POST', headers, body: JSON.stringify({ search: searchTerm }),
      });
      const json = await res.json() as { data?: SyncResult[] };
      if (json.data) setResults(json.data);
    } catch { setError('Sync falhou'); }
    setSyncing(false);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-bold text-white">
        Painel Admin
        <span className="ml-3 text-sm font-normal text-white/40">
          logado como {user?.username}
        </span>
      </h1>

      <div className="flex flex-col gap-6">
        {/* Sync por AniList ID */}
        <section className="rounded-xl bg-white/5 p-5">
          <h2 className="mb-3 text-base font-semibold text-white">Sync por AniList ID</h2>
          <div className="flex gap-2">
            <input
              value={anilistId}
              onChange={(e) => setAnilistId(e.target.value)}
              placeholder="Ex: 20"
              className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={syncAniList}
              disabled={syncing}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Sincronizando...' : 'Sync'}
            </button>
          </div>
        </section>

        {/* Sync por MAL ID */}
        <section className="rounded-xl bg-white/5 p-5">
          <h2 className="mb-3 text-base font-semibold text-white">Sync por MAL ID (Jikan)</h2>
          <div className="flex gap-2">
            <input
              value={malId}
              onChange={(e) => setMalId(e.target.value)}
              placeholder="Ex: 1535"
              className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={syncMal}
              disabled={syncing}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {syncing ? 'Sincronizando...' : 'Sync'}
            </button>
          </div>
        </section>

        {/* Sync por busca */}
        <section className="rounded-xl bg-white/5 p-5">
          <h2 className="mb-3 text-base font-semibold text-white">Buscar e Sincronizar (AniList)</h2>
          <div className="flex gap-2">
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: Attack on Titan"
              className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:ring-1 focus:ring-purple-500"
            />
            <button
              onClick={syncSearch}
              disabled={syncing}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
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
          <div className="py-4 text-center text-sm text-white/40">
            Sincronizando com a API externa, aguarde...
          </div>
        )}

        {!syncing && results.length > 0 && (
          <section className="rounded-xl bg-white/5 p-5">
            <h2 className="mb-3 text-base font-semibold text-white">Resultados</h2>
            <div className="flex flex-col gap-2">
              {results.map((r) => (
                <div key={r.animeId} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">{r.slug}</p>
                    <p className="text-xs text-white/40">
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

        {!syncing && results.length === 0 && !error && (
          <EmptyState
            title="Pronto para sincronizar"
            description="Use os campos acima para importar animes das APIs externas."
          />
        )}
      </div>
    </div>
  );
}
