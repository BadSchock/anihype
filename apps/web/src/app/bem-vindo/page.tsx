'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Mascot } from '@/components/brand/mascot';
import { ProfileBanner } from '@/components/profile/profile-banner';
import { useAuthHydrated } from '@/hooks/use-auth-hydrated';
import { useAnimeSearch } from '@/hooks/use-anime';
import { useAnimeFollowStatus, useToggleAnimeFollow } from '@/hooks/use-anime-follow';
import { useSetTopAnime, useUserTopAnime } from '@/hooks/use-top-anime';
import { buildLoginUrl } from '@/lib/auth-url';
import { PROFILE_BANNERS } from '@/lib/profile-banners';
import { getHypeRules, setMyOnboarding } from '@/services/api';
import { useAuthStore } from '@/stores/auth.store';
import type { AnimeListItem, TopAnimeEntry } from '@/types/api';

const STEPS = [
  { id: 'welcome', label: 'Boas-vindas' },
  { id: 'follow', label: 'Animes' },
  { id: 'top', label: 'Top 4' },
  { id: 'profile', label: 'Perfil' },
  { id: 'xp', label: 'Hype XP' },
] as const;

type Slot = { animeId: number; title: string; cover?: string | null } | null;

function animeTitle(anime: Pick<AnimeListItem, 'titleRomaji' | 'titleEnglish'>) {
  return anime.titleEnglish || anime.titleRomaji;
}

function slotsFromEntries(entries: TopAnimeEntry[]): Slot[] {
  const next: Slot[] = [null, null, null, null];
  for (const entry of entries) {
    if (entry.position < 1 || entry.position > 4) continue;
    next[entry.position - 1] = {
      animeId: entry.anime.id,
      title: animeTitle(entry.anime),
      cover: entry.anime.coverImageUrl,
    };
  }
  return next;
}

export default function WelcomePage() {
  const router = useRouter();
  const { authReady, isAuthenticated, user } = useAuthHydrated();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace(buildLoginUrl('/bem-vindo'));
      return;
    }
    if (user?.onboardingState === 'done') {
      router.replace('/');
    }
  }, [authReady, isAuthenticated, user?.onboardingState, router]);

  async function persist(state: 'later' | 'done') {
    setSaving(true);
    setSaveError(null);
    try {
      const result = await setMyOnboarding(state);
      const current = useAuthStore.getState().user;
      if (current) {
        useAuthStore.setState({ user: { ...current, onboardingState: result.onboardingState } });
      }
      router.push('/');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Não foi possível salvar agora.');
      setSaving(false);
    }
  }

  if (!authReady || !user || user.onboardingState === 'done') {
    return (
      <div className="mx-auto mt-6 h-80 max-w-lg animate-pulse rounded-2xl border border-border bg-card" />
    );
  }

  const current = STEPS[step] ?? STEPS[0];

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-muted-foreground">
            Passo {step + 1} de {STEPS.length}
          </p>
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
            disabled={saving}
            onClick={() => void persist('later')}
          >
            Pular
          </button>
        </div>

        <div
          className="mb-5 flex gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={`Apresentação, passo ${step + 1} de ${STEPS.length}: ${current.label}`}
        >
          {STEPS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir para ${item.label}`}
              className={`h-1.5 min-w-0 flex-1 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 ${
                index <= step ? 'bg-purple-500' : 'bg-muted'
              }`}
              onClick={() => setStep(index)}
            />
          ))}
        </div>

        <Mascot size={step === 0 ? 'md' : 'sm'} className="mb-3" />

        {step === 0 && <WelcomeStep />}
        {step === 1 && <FollowStep username={user.username} />}
        {step === 2 && <TopStep username={user.username} />}
        {step === 3 && <ProfileStep />}
        {step === 4 && <XpStep />}

        {saveError ? <p className="mt-4 text-sm text-red-400">{saveError}</p> : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {step > 0 ? (
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
              onClick={() => setStep((value) => value - 1)}
            >
              Voltar
            </button>
          ) : (
            <span className="hidden sm:block" />
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300"
              onClick={() => setStep((value) => value + 1)}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-300 disabled:opacity-60"
              disabled={saving}
              onClick={() => void persist('done')}
            >
              {saving ? 'Salvando…' : 'Começar a explorar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">Bem-vindo ao AniHype!</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Aqui a temporada de anime vira conversa. Você acompanha o que está no ar, guarda os
        favoritos e encontra outras pessoas da comunidade.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        Esta apresentação é curta e opcional. Dá para pular agora e retomar pelo seu perfil.
      </p>
    </div>
  );
}

function SearchBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-4 block text-sm">
      <span className="mb-1.5 block font-medium text-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Nome do anime"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
      />
    </label>
  );
}

function FollowStep({ username }: { username: string }) {
  const [query, setQuery] = useState('');
  const search = useAnimeSearch(query);

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Escolha seus animes</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Seguir um anime deixa ele na sua lista. Pode seguir quantos quiser, ou nenhum agora.
      </p>
      <SearchBox label="Buscar anime" value={query} onChange={setQuery} />
      <ul className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
        {(search.data ?? []).slice(0, 6).map((anime) => (
          <FollowRow key={anime.id} anime={anime} username={username} />
        ))}
      </ul>
      {query.trim().length >= 2 && search.isFetching ? (
        <p className="mt-2 text-xs text-muted-foreground">Buscando…</p>
      ) : null}
    </div>
  );
}

function FollowRow({ anime, username }: { anime: AnimeListItem; username: string }) {
  const status = useAnimeFollowStatus(anime.slug);
  const toggle = useToggleAnimeFollow(anime.slug, username);
  const following = status.data?.following ?? false;

  return (
    <li className="flex min-w-0 items-center gap-2 rounded-lg border border-border px-2 py-1.5">
      <Cover src={anime.coverImageUrl} alt="" />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{animeTitle(anime)}</span>
      <button
        type="button"
        className="shrink-0 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 disabled:opacity-60"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate(following)}
      >
        {following ? 'Seguindo' : 'Seguir'}
      </button>
    </li>
  );
}

function TopStep({ username }: { username: string }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [slots, setSlots] = useState<Slot[]>([null, null, null, null]);
  const [ready, setReady] = useState(false);
  const search = useAnimeSearch(query);
  const current = useUserTopAnime(username);
  const save = useSetTopAnime(username);

  useEffect(() => {
    if (ready || !current.isFetched) return;
    setSlots(slotsFromEntries(current.data ?? []));
    setReady(true);
  }, [current.data, current.isFetched, ready]);

  function pick(anime: AnimeListItem) {
    const next = slots.map((slot) => (slot?.animeId === anime.id ? null : slot));
    next[active] = {
      animeId: anime.id,
      title: animeTitle(anime),
      cover: anime.coverImageUrl,
    };
    setSlots(next);
    setActive((active + 1) % 4);
    save.mutate({
      items: next.flatMap((slot, index) =>
        slot ? [{ animeId: slot.animeId, position: index + 1 }] : [],
      ),
    });
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Monte seu Top 4</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Escolha os favoritos que aparecem no seu perfil. Quatro lugares, sem obrigação de preencher
        todos.
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {slots.map((slot, index) => (
          <button
            key={index}
            type="button"
            aria-pressed={active === index}
            aria-label={slot ? `Posição ${index + 1}, ${slot.title}` : `Posição ${index + 1} vazia`}
            className={`min-w-0 rounded-lg border p-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500 ${
              active === index ? 'border-purple-500' : 'border-border'
            }`}
            onClick={() => setActive(index)}
          >
            <Cover src={slot?.cover} alt="" wide />
            <span className="mt-1 block truncate text-[11px] text-foreground">
              {slot?.title ?? `${index + 1}`}
            </span>
          </button>
        ))}
      </div>
      <SearchBox label="Buscar favorito" value={query} onChange={setQuery} />
      <ul className="mt-3 flex max-h-52 flex-col gap-2 overflow-y-auto">
        {(search.data ?? []).slice(0, 6).map((anime) => (
          <li key={anime.id}>
            <button
              type="button"
              className="flex w-full min-w-0 items-center gap-2 rounded-lg border border-border px-2 py-1.5 text-left hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
              onClick={() => pick(anime)}
            >
              <Cover src={anime.coverImageUrl} alt="" />
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{animeTitle(anime)}</span>
            </button>
          </li>
        ))}
      </ul>
      {save.isError ? (
        <p className="mt-2 text-xs text-red-400">Não foi possível salvar o Top 4 agora.</p>
      ) : null}
    </div>
  );
}

function ProfileStep() {
  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Seu perfil</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Foto, bio e o fundo do perfil ficam na edição. Há três fundos iniciais: Original, Neon e
        Cósmico.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {PROFILE_BANNERS.map((banner) => (
          <div key={banner.id} className="min-w-0">
            <ProfileBanner bannerId={banner.id} variant="thumb" className="h-12 rounded-lg" />
            <p className="mt-1 truncate text-center text-[11px] text-muted-foreground">{banner.name}</p>
          </div>
        ))}
      </div>
      <Link
        href="/perfil/editar"
        className="mt-4 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-500"
      >
        Personalizar agora
      </Link>
    </div>
  );
}

function XpStep() {
  const rules = useQuery({
    queryKey: ['hype', 'rules'],
    queryFn: getHypeRules,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Conheça o Hype XP</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Participar da comunidade soma XP de verdade. Só olhar esta tela não dá ponto.
      </p>
      {rules.isError ? (
        <p className="mt-3 text-sm text-red-400">Não foi possível carregar as regras agora.</p>
      ) : null}
      <ul className="mt-3 flex flex-col gap-1.5">
        {(rules.data?.actions ?? []).map((action) => (
          <li key={action.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 text-foreground">{action.label}</span>
            <span className="shrink-0 font-medium text-purple-300">
              +{action.points} XP
              {action.dailyLimit ? ` · até ${action.dailyLimit}/dia` : ''}
            </span>
          </li>
        ))}
      </ul>
      {rules.data?.badges?.length ? (
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Conquistas atuais:{' '}
          {rules.data.badges.map((badge) => badge.name).join(', ')}.
        </p>
      ) : null}
      {(rules.data?.notes ?? []).map((note) => (
        <p key={note} className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {note}
        </p>
      ))}
      <Link href="/ranking" className="mt-3 inline-flex text-sm text-purple-400 hover:underline">
        Ver o ranking
      </Link>
    </div>
  );
}

function Cover({ src, alt, wide }: { src?: string | null; alt: string; wide?: boolean }) {
  if (!src) {
    return (
      <span
        className={`block shrink-0 rounded bg-muted ${wide ? 'aspect-[3/4] w-full' : 'h-12 w-9'}`}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`shrink-0 rounded object-cover ${wide ? 'aspect-[3/4] w-full' : 'h-12 w-9'}`}
    />
  );
}
