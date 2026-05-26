import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AnimeProviderResult, NormalizedAnime, NormalizedEpisode } from '../provider.types';

interface JikanAnime {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  synopsis: string | null;
  images: { jpg: { large_image_url: string | null }; webp: { large_image_url: string | null } };
  trailer: { url: string | null } | null;
  status: string;
  type: string | null;
  source: string | null;
  episodes: number | null;
  duration: string | null;
  score: number | null;
  popularity: number | null;
  season: string | null;
  year: number | null;
  genres: Array<{ name: string }>;
  studios: Array<{ name: string }>;
  explicit_genres: Array<{ name: string }>;
  rating: string | null;
}

interface JikanEpisode {
  mal_id: number;
  title: string | null;
  filler: boolean;
  recap: boolean;
  aired: string | null;
}

@Injectable()
export class JikanService {
  private readonly logger = new Logger(JikanService.name);
  private readonly client: AxiosInstance;

  constructor(config: ConfigService) {
    const baseURL = config.get<string>('providers.jikanApiUrl') ?? 'https://api.jikan.moe/v4';
    this.client = axios.create({
      baseURL,
      timeout: 15000,
    });
  }

  async searchAnime(query: string, page = 1): Promise<JikanAnime[]> {
    try {
      const { data } = await this.client.get<{ data: JikanAnime[] }>('/anime', {
        params: { q: query, page, limit: 20 },
      });
      return data.data ?? [];
    } catch (err) {
      this.logger.error(`Jikan searchAnime falhou: ${String(err)}`);
      return [];
    }
  }

  async getAnimeById(malId: number): Promise<AnimeProviderResult | null> {
    try {
      const [animeRes, episodesRes] = await Promise.all([
        this.client.get<{ data: JikanAnime }>(`/anime/${malId}/full`),
        this.client.get<{ data: JikanEpisode[] }>(`/anime/${malId}/episodes`),
      ]);

      const jikanAnime = animeRes.data.data;
      const jikanEpisodes = episodesRes.data.data ?? [];

      return {
        anime: this.normalizeAnime(jikanAnime),
        episodes: jikanEpisodes.map((e) => this.normalizeEpisode(e)),
      };
    } catch (err) {
      this.logger.error(`Jikan getAnimeById(${malId}) falhou: ${String(err)}`);
      return null;
    }
  }

  normalizeAnime(j: JikanAnime): NormalizedAnime {
    return {
      titleRomaji: j.title,
      titleEnglish: j.title_english ?? null,
      titleNative: j.title_japanese ?? null,
      synopsis: j.synopsis ?? null,
      coverImageUrl:
        j.images?.webp?.large_image_url ?? j.images?.jpg?.large_image_url ?? null,
      bannerImageUrl: null,
      status: this.mapStatus(j.status),
      format: j.type ?? null,
      source: j.source ?? null,
      season: j.season ? j.season.toUpperCase() : null,
      seasonYear: j.year ?? null,
      episodeCount: j.episodes ?? null,
      episodeDuration: j.duration ? this.parseDuration(j.duration) : null,
      averageScore: j.score ? Math.round(j.score * 10) : null,
      popularityScore: j.popularity ?? null,
      trailerUrl: j.trailer?.url ?? null,
      isAdult: (j.rating ?? '').includes('Hentai'),
      genres: j.genres.map((g) => g.name),
      studios: j.studios.map((s) => ({ name: s.name, role: 'main' })),
      externalIds: [{ source: 'mal', externalId: String(j.mal_id) }],
    };
  }

  private normalizeEpisode(e: JikanEpisode): NormalizedEpisode {
    const airDate = e.aired ? new Date(e.aired) : null;
    const now = new Date();
    const hasPassed = airDate !== null && airDate <= now;

    return {
      number: e.mal_id,
      title: e.title ?? null,
      synopsis: null,
      thumbnailUrl: null,
      airDate,
      airTimeUtc: airDate,
      durationMinutes: null,
      status: hasPassed ? 'AIRED' : 'UPCOMING',
    };
  }

  private mapStatus(raw: string): string {
    const map: Record<string, string> = {
      'Finished Airing': 'FINISHED',
      'Currently Airing': 'AIRING',
      'Not yet aired': 'NOT_YET_AIRED',
    };
    return map[raw] ?? 'NOT_YET_AIRED';
  }

  private parseDuration(raw: string): number | null {
    const match = raw.match(/(\d+)\s*min/i);
    return match ? parseInt(match[1] ?? '0', 10) : null;
  }
}
