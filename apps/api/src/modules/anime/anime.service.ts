import { Injectable, NotFoundException } from '@nestjs/common';
import { AnimeRepository, AnimeWithRelations } from './anime.repository';
import { AnimeQueryDto } from './dto/anime-query.dto';
import {
  AnimeDetailDto,
  AnimeListItemDto,
  GenreDto,
  StreamingLinkDto,
  StudioDto,
} from './dto/anime-response.dto';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { formatSynopsisText } from '../../common/text/format-synopsis';
import {
  parseGenreIdList,
  parseGenreSlugList,
  resolveEffectiveGenreIds,
} from './genre-filter.util';

@Injectable()
export class AnimeService {
  constructor(private readonly repo: AnimeRepository) {}

  async findMany(query: AnimeQueryDto): Promise<PaginatedResult<AnimeListItemDto>> {
    const resolved = await this.resolveGenreFilter(query);
    if (resolved === 'empty') {
      return paginate([], 0, query.page, query.limit);
    }
    const result = await this.repo.findMany(query, resolved);
    return {
      data: result.data.map((a) => this.toListItem(a)),
      meta: result.meta,
    };
  }

  async listGenres(): Promise<GenreDto[]> {
    return this.repo.findAllGenres();
  }

  async findByIdOrSlug(idOrSlug: string): Promise<AnimeDetailDto> {
    const anime = await this.repo.findByIdOrSlug(idOrSlug);
    if (!anime) {
      throw new NotFoundException(`Anime "${idOrSlug}" não encontrado.`);
    }
    return this.toDetail(anime);
  }

  private async resolveGenreFilter(
    query: AnimeQueryDto,
  ): Promise<number[] | 'empty' | undefined> {
    const slugsRequested = parseGenreSlugList(query.genre);
    const fromCsv = parseGenreIdList(query.genreIds);
    const explicitIds = [...fromCsv, ...(query.genreId ? [query.genreId] : [])];

    const slugIdsFound =
      slugsRequested.length > 0 ? await this.repo.findGenreIdsBySlugs(slugsRequested) : [];

    return resolveEffectiveGenreIds({
      slugsRequested,
      slugIdsFound,
      explicitIds,
    });
  }

  // ---------------------------------------------------------------------------
  // Normalização de slug: remove acentos, lowercases, hifeniza
  // ---------------------------------------------------------------------------
  static normalizeSlug(title: string): string {
    return title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ---------------------------------------------------------------------------
  // Mappers
  // ---------------------------------------------------------------------------
  private toListItem(a: AnimeWithRelations): AnimeListItemDto {
    return {
      id: a.id,
      slug: a.slug,
      titleRomaji: a.titleRomaji,
      titleEnglish: a.titleEnglish,
      titleNative: a.titleNative,
      synopsis: formatSynopsisText(a.synopsis),
      coverImageUrl: a.coverImageUrl,
      bannerImageUrl: a.bannerImageUrl,
      status: a.status,
      format: a.format ?? null,
      season: a.season ?? null,
      seasonYear: a.seasonYear ?? null,
      episodeCount: a.episodeCount ?? null,
      averageScore: a.averageScore ? Number(a.averageScore) : null,
      popularityScore: a.popularityScore ?? null,
      genres: this.mapGenres(a),
      studios: this.mapStudios(a),
      ratingCount: a.ratingCount,
      ratingAverage: a.ratingAverage ? Number(a.ratingAverage) : null,
      ratingAnimation: a.ratingAnimation ? Number(a.ratingAnimation) : null,
      ratingStory: a.ratingStory ? Number(a.ratingStory) : null,
      ratingCharacters: a.ratingCharacters ? Number(a.ratingCharacters) : null,
      ratingSound: a.ratingSound ? Number(a.ratingSound) : null,
      ratingHype: a.ratingHype ? Number(a.ratingHype) : null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }

  private toDetail(a: AnimeWithRelations): AnimeDetailDto {
    return {
      ...this.toListItem(a),
      trailerUrl: a.trailerUrl ?? null,
      episodeDuration: a.episodeDuration ?? null,
      isAdult: a.isAdult,
      streamingLinks: this.mapStreamingLinks(a),
    };
  }

  private mapStreamingLinks(a: AnimeWithRelations): StreamingLinkDto[] {
    return a.streamingLinks.map((link) => ({
      id: link.id,
      url: link.url,
      regionCode: link.regionCode ?? null,
      platform: {
        id: link.platform.id,
        name: link.platform.name,
        slug: link.platform.slug,
        homepageUrl: link.platform.homepageUrl ?? null,
      },
    }));
  }

  private mapGenres(a: AnimeWithRelations): GenreDto[] {
    return a.genres.map(({ genre }) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
    }));
  }

  private mapStudios(a: AnimeWithRelations): StudioDto[] {
    return a.studios.map(({ studio, role }) => ({
      id: studio.id,
      name: studio.name,
      role: role ?? null,
    }));
  }
}
