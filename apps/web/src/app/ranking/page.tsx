import type { Metadata } from 'next';
import { RankingClient } from './ranking-client';

export const metadata: Metadata = {
  title: 'Ranking',
  description: 'Top animes da comunidade e ranking de membros por Hype XP.',
};

export default function RankingPage() {
  return <RankingClient />;
}
