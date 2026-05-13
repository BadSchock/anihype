export type AnimeStatus = 'AIRING' | 'FINISHED' | 'NOT_YET_AIRED' | 'CANCELLED' | 'HIATUS';
export type AnimeSeason = 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
export type AnimeFormat = 'TV' | 'MOVIE' | 'OVA' | 'ONA' | 'SPECIAL' | 'MUSIC';
export type AnimeSource =
  | 'MANGA'
  | 'LIGHT_NOVEL'
  | 'ORIGINAL'
  | 'VISUAL_NOVEL'
  | 'GAME'
  | 'NOVEL'
  | 'DOUJINSHI'
  | 'ANIME'
  | 'OTHER';

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Studio {
  id: number;
  name: string;
  slug: string;
}

export interface Anime {
  id: number;
  slug: string;
  titleRomaji: string;
  titleEnglish: string | null;
  titleNative: string | null;
  synopsis: string | null;
  coverImageUrl: string | null;
  bannerImageUrl: string | null;
  status: AnimeStatus;
  format: AnimeFormat | null;
  season: AnimeSeason | null;
  seasonYear: number | null;
  episodeCount: number | null;
  episodeDuration: number | null;
  score: number | null;
  source: AnimeSource | null;
  trailerUrl: string | null;
  isAdult: boolean;
  genres: Genre[];
  studios: Studio[];
  createdAt: string;
  updatedAt: string;
}

export interface AnimeListItem {
  id: number;
  slug: string;
  titleRomaji: string;
  titleEnglish: string | null;
  coverImageUrl: string | null;
  status: AnimeStatus;
  season: AnimeSeason | null;
  seasonYear: number | null;
  score: number | null;
  genres: Genre[];
}

export interface AnimeListResponse {
  data: AnimeListItem[];
  meta: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
