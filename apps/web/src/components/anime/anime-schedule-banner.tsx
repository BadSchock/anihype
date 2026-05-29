'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAnimeEpisodes } from '@/services/api';
import { formatAirTimeBrt, getEpisodeAiredAt } from '@/lib/date-brt';
import type { Episode } from '@/types/api';

interface Props {
  animeId: number;
  animeSlug: string;
}

export function AnimeScheduleBanner({ animeId, animeSlug }: Props) {
  const [nextEpisode, setNextEpisode] = useState<Episode | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await getAnimeEpisodes(animeId, 1, 50);
        const upcoming = res.data
          .filter((ep) => ep.status === 'UPCOMING')
          .sort((a, b) => {
            const ta = getEpisodeAiredAt(a);
            const tb = getEpisodeAiredAt(b);
            if (!ta) return 1;
            if (!tb) return -1;
            return new Date(ta).getTime() - new Date(tb).getTime();
          });
        if (!cancelled && upcoming[0]) {
          setNextEpisode(upcoming[0]);
        }
      } catch {
        /* ignore */
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [animeId]);

  if (!nextEpisode) return null;

  const airedAt = getEpisodeAiredAt(nextEpisode);
  if (!airedAt) return null;

  const dateLabel = new Date(airedAt).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  });
  const timeLabel = formatAirTimeBrt(airedAt);

  return (
    <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-sm">
      <p className="font-medium text-yellow-200">
        Próximo episódio
      </p>
      <p className="mt-1 text-foreground/80">
        <Link
          href={`/anime/${animeSlug}/ep/${nextEpisode.number}`}
          className="font-semibold text-foreground hover:text-purple-400"
        >
          Ep {nextEpisode.number}
          {nextEpisode.title ? ` — ${nextEpisode.title}` : ''}
        </Link>
        {' · '}
        {dateLabel} às {timeLabel} (BRT)
      </p>
    </div>
  );
}
