/**
 * Tipos normalizados que os providers devem retornar.
 * O SyncService usa estes tipos para salvar no banco.
 */

export interface NormalizedAnime {
  titleRomaji: string;
  titleEnglish: string | null;
  titleNative: string | null;
  synopsis: string | null;
  coverImageUrl: string | null;
  bannerImageUrl: string | null;
  status: string;
  format: string | null;
  source: string | null;
  season: string | null;
  seasonYear: number | null;
  episodeCount: number | null;
  episodeDuration: number | null;
  averageScore: number | null;
  popularityScore: number | null;
  trailerUrl: string | null;
  isAdult: boolean;
  genres: string[];
  studios: Array<{ name: string; role: string | null }>;
  externalIds: Array<{ source: string; externalId: string }>;
  streamingPlatforms: Array<{ site: string; url: string }>;
}

export interface NormalizedEpisode {
  number: number;
  title: string | null;
  synopsis: string | null;
  thumbnailUrl: string | null;
  airDate: Date | null;
  airTimeUtc: Date | null;
  durationMinutes: number | null;
  status: string;
}

export interface AnimeProviderResult {
  anime: NormalizedAnime;
  episodes: NormalizedEpisode[];
}
