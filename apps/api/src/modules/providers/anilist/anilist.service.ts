import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { AnimeProviderResult, NormalizedAnime, NormalizedEpisode } from '../provider.types';

const ANIME_QUERY = `
query ($id: Int, $search: String, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(id: $id, search: $search, type: ANIME, sort: POPULARITY_DESC) {
      id
      title { romaji english native }
      description(asHtml: false)
      coverImage { extraLarge large }
      bannerImage
      status
      format
      source
      season
      seasonYear
      episodes
      duration
      averageScore
      popularity
      trailer { id site }
      isAdult
      genres
      studios(isMain: false) {
        edges { isMain node { name } }
      }
      streamingEpisodes { title thumbnail url site }
    }
  }
}
`;

const EPISODES_QUERY = `
query ($id: Int!, $page: Int) {
  Media(id: $id, type: ANIME) {
    streamingEpisodes { title thumbnail url site }
    airingSchedule(page: $page, perPage: 50) {
      nodes { episode airingAt timeUntilAiring }
    }
  }
}
`;

interface AniListMedia {
  id: number;
  title: { romaji: string; english: string | null; native: string | null };
  description: string | null;
  coverImage: { extraLarge: string | null; large: string | null };
  bannerImage: string | null;
  status: string;
  format: string | null;
  source: string | null;
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  duration: number | null;
  averageScore: number | null;
  popularity: number | null;
  trailer: { id: string; site: string } | null;
  isAdult: boolean;
  genres: string[];
  studios: {
    edges: Array<{
      isMain: boolean;
      node: { name: string };
    }>;
  };
}

interface AniListAiringNode {
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

@Injectable()
export class AniListService {
  private readonly logger = new Logger(AniListService.name);
  private readonly client: AxiosInstance;

  constructor(config: ConfigService) {
    const baseURL = config.get<string>('providers.anilistApiUrl') ?? 'https://graphql.anilist.co';
    this.client = axios.create({
      baseURL,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      timeout: 15000,
    });
  }

  async searchAnime(search: string, page = 1, perPage = 20): Promise<AniListMedia[]> {
    try {
      const { data } = await this.client.post<{ data: { Page: { media: AniListMedia[] } } }>('', {
        query: ANIME_QUERY,
        variables: { search, page, perPage },
      });
      return data.data.Page.media ?? [];
    } catch (err) {
      this.logger.error(`AniList searchAnime falhou: ${String(err)}`);
      return [];
    }
  }

  async getAnimeById(id: number): Promise<AnimeProviderResult | null> {
    try {
      const { data } = await this.client.post<{ data: { Page: { media: AniListMedia[] } } }>('', {
        query: ANIME_QUERY,
        variables: { id, page: 1, perPage: 1 },
      });

      const media = data.data.Page.media[0];
      if (!media) return null;

      const anime = this.normalizeAnime(media);
      const episodes = await this.getEpisodes(id);

      return { anime, episodes };
    } catch (err) {
      this.logger.error(`AniList getAnimeById(${id}) falhou: ${String(err)}`);
      return null;
    }
  }

  private async getEpisodes(anilistId: number): Promise<NormalizedEpisode[]> {
    try {
      const { data } = await this.client.post<{
        data: { Media: { airingSchedule: { nodes: AniListAiringNode[] } } };
      }>('', {
        query: EPISODES_QUERY,
        variables: { id: anilistId, page: 1 },
      });

      const nodes = data.data.Media?.airingSchedule?.nodes ?? [];
      return nodes.map((n) => this.normalizeEpisode(n));
    } catch {
      return [];
    }
  }

  normalizeAnime(media: AniListMedia): NormalizedAnime {
    return {
      titleRomaji: media.title.romaji,
      titleEnglish: media.title.english ?? null,
      titleNative: media.title.native ?? null,
      synopsis: media.description ?? null,
      coverImageUrl: media.coverImage.extraLarge ?? media.coverImage.large ?? null,
      bannerImageUrl: media.bannerImage ?? null,
      status: this.mapStatus(media.status),
      format: media.format ?? null,
      source: media.source ?? null,
      season: media.season ?? null,
      seasonYear: media.seasonYear ?? null,
      episodeCount: media.episodes ?? null,
      episodeDuration: media.duration ?? null,
      averageScore: media.averageScore ?? null,
      popularityScore: media.popularity ?? null,
      trailerUrl:
        media.trailer?.site === 'youtube'
          ? `https://www.youtube.com/watch?v=${media.trailer.id}`
          : null,
      isAdult: media.isAdult,
      genres: media.genres,
      studios: media.studios.edges.map((e) => ({
        name: e.node.name,
        role: e.isMain ? 'main' : null,
      })),
      externalIds: [{ source: 'anilist', externalId: String(media.id) }],
    };
  }

  private normalizeEpisode(node: AniListAiringNode): NormalizedEpisode {
    const airDate = new Date(node.airingAt * 1000);
    const now = new Date();
    const hasPassed = airDate <= now;

    return {
      number: node.episode,
      title: null,
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
      FINISHED: 'FINISHED',
      RELEASING: 'AIRING',
      NOT_YET_RELEASED: 'NOT_YET_AIRED',
      CANCELLED: 'CANCELLED',
      HIATUS: 'HIATUS',
    };
    return map[raw] ?? 'NOT_YET_AIRED';
  }
}
