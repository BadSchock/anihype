import { Injectable, NotFoundException } from '@nestjs/common';
import { EpisodesRepository, EpisodeWithAnime } from './episodes.repository';
import { EpisodeQueryDto } from './dto/episode-query.dto';
import { CalendarDayDto, EpisodeDto, EpisodeWithAnimeDto } from './dto/episode-response.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class EpisodesService {
  constructor(private readonly repo: EpisodesRepository) {}

  async findByAnime(
    animeId: number,
    query: EpisodeQueryDto,
  ): Promise<PaginatedResult<EpisodeWithAnimeDto>> {
    const result = await this.repo.findByAnime(animeId, query);
    return {
      data: result.data.map((e) => this.toDtoWithAnime(e)),
      meta: result.meta,
    };
  }

  async findById(id: number): Promise<EpisodeWithAnimeDto> {
    const episode = await this.repo.findById(id);
    if (!episode) throw new NotFoundException(`Episódio com ID ${id} não encontrado.`);
    return this.toDtoWithAnime(episode);
  }

  async findByAnimeAndNumber(animeId: number, number: number): Promise<EpisodeWithAnimeDto> {
    const episode = await this.repo.findByAnimeAndNumber(animeId, number);
    if (!episode)
      throw new NotFoundException(`Episódio ${number} do anime ${animeId} não encontrado.`);
    return this.toDtoWithAnime(episode);
  }

  async findByAnimeAndSlug(animeId: number, slug: string): Promise<EpisodeWithAnimeDto> {
    const episode = await this.repo.findByAnimeAndSlug(animeId, slug);
    if (!episode)
      throw new NotFoundException(`Episódio "${slug}" do anime ${animeId} não encontrado.`);
    return this.toDtoWithAnime(episode);
  }

  async findTodayReleases(): Promise<EpisodeWithAnimeDto[]> {
    const episodes = await this.repo.findTodayReleases();
    return episodes.map((e) => this.toDtoWithAnime(e));
  }

  async findWeeklyCalendar(days: number = 7): Promise<CalendarDayDto[]> {
    const episodes = await this.repo.findWeeklyCalendar(days);
    return this.groupByDate(episodes, 'asc');
  }

  async findRecentReleases(days: number = 7): Promise<CalendarDayDto[]> {
    const now = Date.now();
    const episodes = (await this.repo.findRecentReleases(days)).filter((ep) => {
      const airedAt = ep.airTimeUtc ?? ep.airDate;
      return airedAt !== null && airedAt.getTime() <= now;
    });
    return this.groupByDate(episodes, 'desc');
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private toDto(e: EpisodeWithAnime): EpisodeDto {
    return {
      id: e.id,
      animeId: e.animeId,
      slug: e.slug,
      number: e.number,
      title: e.title ?? null,
      synopsis: e.synopsis ?? null,
      thumbnailUrl: e.thumbnailUrl ?? null,
      airDate: e.airDate ?? null,
      airTimeUtc: e.airTimeUtc ?? null,
      durationMinutes: e.durationMinutes ?? null,
      status: e.status,
      scoreAverage: e.scoreAverage ? Number(e.scoreAverage) : null,
      delayReason: e.delayReason ?? null,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  }

  private toDtoWithAnime(e: EpisodeWithAnime): EpisodeWithAnimeDto {
    return {
      ...this.toDto(e),
      anime: {
        id: e.anime.id,
        slug: e.anime.slug,
        titleRomaji: e.anime.titleRomaji,
        titleEnglish: e.anime.titleEnglish ?? null,
        coverImageUrl: e.anime.coverImageUrl ?? null,
      },
    };
  }

  private groupByDate(
    episodes: EpisodeWithAnime[],
    order: 'asc' | 'desc' = 'asc',
  ): CalendarDayDto[] {
    const map = new Map<string, EpisodeWithAnimeDto[]>();
    const BRT_OFFSET_MS = 3 * 60 * 60 * 1000;

    for (const ep of episodes) {
      let date: string;
      const airedAt = ep.airTimeUtc ?? ep.airDate;
      if (airedAt) {
        const brtDate = new Date(airedAt.getTime() - BRT_OFFSET_MS);
        date = brtDate.toISOString().split('T')[0] ?? 'unknown';
      } else {
        date = 'unknown';
      }
      if (!map.has(date)) map.set(date, []);
      (map.get(date) as EpisodeWithAnimeDto[]).push(this.toDtoWithAnime(ep));
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => (order === 'desc' ? b.localeCompare(a) : a.localeCompare(b)))
      .map(([date, epList]) => ({ date, episodes: epList }));
  }
}
