import { Injectable, Logger } from '@nestjs/common';
import { AnimeFormat, AnimeSeason, AnimeSourceKind, AnimeStatus, EpisodeStatus, ExternalProviderKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AniListService } from '../providers/anilist/anilist.service';
import { JikanService } from '../providers/jikan/jikan.service';
import { AnimeService } from '../anime/anime.service';
import { AnimeProviderResult, NormalizedAnime, NormalizedEpisode } from '../providers/provider.types';

export type SyncProvider = 'anilist' | 'jikan';

export interface SyncResult {
  animeId: number;
  slug: string;
  episodesSynced: number;
  created: boolean;
}

export interface SeasonSyncOptions {
  season: AnimeSeason;
  seasonYear: number;
  /** Só animes em exibição (RELEASING no AniList) */
  airingOnly?: boolean;
  /** Pausa entre cada anime (ms) — evita rate limit */
  delayMs?: number;
  perPage?: number;
}

export interface SeasonSyncError {
  anilistId: number;
  title: string;
  error: string;
}

export interface SeasonSyncResult {
  season: AnimeSeason;
  seasonYear: number;
  airingOnly: boolean;
  totalFound: number;
  synced: number;
  created: number;
  updated: number;
  failed: number;
  results: SyncResult[];
  errors: SeasonSyncError[];
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly anilist: AniListService,
    private readonly jikan: JikanService,
  ) {}

  // ---------------------------------------------------------------------------
  // Sync por ID externo
  // ---------------------------------------------------------------------------

  async syncByAniListId(anilistId: number): Promise<SyncResult | null> {
    this.logger.log(`Iniciando sync AniList ID=${anilistId}`);
    const result = await this.anilist.getAnimeById(anilistId);
    if (!result) {
      this.logger.warn(`AniList ID=${anilistId} não encontrado`);
      return null;
    }
    return this.upsertAnimeWithEpisodes(result, 'anilist', String(anilistId));
  }

  async syncByMalId(malId: number): Promise<SyncResult | null> {
    this.logger.log(`Iniciando sync Jikan MAL ID=${malId}`);
    const result = await this.jikan.getAnimeById(malId);
    if (!result) {
      this.logger.warn(`Jikan MAL ID=${malId} não encontrado`);
      return null;
    }
    return this.upsertAnimeWithEpisodes(result, 'mal', String(malId));
  }

  // ---------------------------------------------------------------------------
  // Buscar + sync pelo título (usa AniList como fonte primária)
  // ---------------------------------------------------------------------------

  async syncBySearch(search: string): Promise<SyncResult[]> {
    this.logger.log(`Sync por busca: "${search}"`);
    const results = await this.anilist.searchAnime(search, 1, 5);
    const synced: SyncResult[] = [];

    for (const media of results) {
      const normalized = this.anilist.normalizeAnime(media as Parameters<typeof this.anilist.normalizeAnime>[0]);
      const episodes: NormalizedEpisode[] = [];
      const result = await this.upsertAnimeWithEpisodes({ anime: normalized, episodes }, 'anilist', String(media.id));
      if (result) synced.push(result);
    }

    return synced;
  }

  // ---------------------------------------------------------------------------
  // Import em massa: temporada inteira (AniList)
  // ---------------------------------------------------------------------------

  async syncSeason(options: SeasonSyncOptions): Promise<SeasonSyncResult> {
    const {
      season,
      seasonYear,
      airingOnly = false,
      delayMs = 800,
      perPage = 50,
    } = options;

    const anilistSeason = season as 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
    const anilistStatus = airingOnly ? ('RELEASING' as const) : undefined;

    this.logger.log(
      `Iniciando sync temporada ${season} ${seasonYear}` +
        (airingOnly ? ' (somente em exibição)' : ''),
    );

    const summary: SeasonSyncResult = {
      season,
      seasonYear,
      airingOnly,
      totalFound: 0,
      synced: 0,
      created: 0,
      updated: 0,
      failed: 0,
      results: [],
      errors: [],
    };

    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const browse = await this.anilist.browseSeason(
        anilistSeason,
        seasonYear,
        page,
        perPage,
        anilistStatus,
      );

      if (page === 1) {
        summary.totalFound = browse.pageInfo.total;
      }

      this.logger.log(
        `Temporada ${season} ${seasonYear}: página ${browse.pageInfo.currentPage}/${browse.pageInfo.lastPage} ` +
          `(${browse.media.length} animes)`,
      );

      for (const item of browse.media) {
        const title = item.title.english ?? item.title.romaji;

        try {
          // Usa os dados já presentes no browse (evita 2ª request à API)
          const normalized = this.anilist.normalizeAnime(item);
          // Episódios: busca separada apenas se o anime está em exibição ou prestes a estrear
          const needsSchedule = ['AIRING', 'NOT_YET_AIRED'].includes(normalized.status);
          const episodes = needsSchedule
            ? await this.anilist.getEpisodesPublic(item.id)
            : [];

          const result = await this.upsertAnimeWithEpisodes(
            { anime: normalized, episodes },
            'anilist',
            String(item.id),
          );

          summary.synced++;
          if (result.created) summary.created++;
          else summary.updated++;
          summary.results.push(result);
          this.logger.log(`  ✓ ${title} → ${result.slug}`);
        } catch (err) {
          summary.failed++;
          summary.errors.push({
            anilistId: item.id,
            title,
            error: err instanceof Error ? err.message : String(err),
          });
          this.logger.error(`  ✗ ${title} (AniList ${item.id}): ${String(err)}`);
        }

        if (delayMs > 0) {
          await this.sleep(delayMs);
        }
      }

      hasNextPage = browse.pageInfo.hasNextPage;
      page++;
    }

    this.logger.log(
      `Sync temporada concluído: ${summary.synced}/${summary.totalFound} ok, ` +
        `${summary.failed} falhas (${summary.created} criados, ${summary.updated} atualizados)`,
    );

    return summary;
  }

  /** Temporada anime atual conforme calendário AniList (WINTER=Jan–Mar, etc.) */
  static getCurrentSeason(): { season: AnimeSeason; seasonYear: number } {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    if (month <= 3) return { season: AnimeSeason.WINTER, seasonYear: year };
    if (month <= 6) return { season: AnimeSeason.SPRING, seasonYear: year };
    if (month <= 9) return { season: AnimeSeason.SUMMER, seasonYear: year };
    return { season: AnimeSeason.FALL, seasonYear: year };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ---------------------------------------------------------------------------
  // Upsert core
  // ---------------------------------------------------------------------------

  private async upsertAnimeWithEpisodes(
    { anime: normalized, episodes }: AnimeProviderResult,
    source: string,
    externalId: string,
  ): Promise<SyncResult> {
    const slug = await this.buildUniqueSlug(normalized.titleRomaji);

    const provider = this.mapProvider(source);

    // Verifica se já existe pelo externalId
    const existing = await this.prisma.animeExternalId.findFirst({
      where: { provider, externalId },
    });

    let animeId: number;
    let created = false;
    let finalSlug = slug;

    if (existing) {
      animeId = existing.animeId;
      await this.updateAnime(animeId, normalized);
      const found = await this.prisma.anime.findUnique({ where: { id: animeId }, select: { slug: true } });
      finalSlug = found?.slug ?? slug;
      this.logger.log(`Anime atualizado: ID=${animeId} slug=${finalSlug}`);
    } else {
      const createdAnime = await this.createAnime(slug, normalized, provider, externalId);
      animeId = createdAnime.id;
      finalSlug = slug;
      created = true;
      this.logger.log(`Anime criado: ID=${animeId} slug=${slug}`);
    }

    const episodesSynced = await this.upsertEpisodes(animeId, normalized.titleRomaji, episodes);
    await this.upsertStreamingPlatforms(animeId, normalized.streamingPlatforms ?? []);

    return { animeId, slug: finalSlug, episodesSynced, created };
  }

  private async createAnime(
    slug: string,
    n: NormalizedAnime,
    provider: ExternalProviderKind,
    externalId: string,
  ) {
    return this.prisma.anime.create({
      data: {
        slug,
        titleRomaji: n.titleRomaji,
        titleEnglish: n.titleEnglish,
        titleNative: n.titleNative,
        synopsis: n.synopsis,
        coverImageUrl: n.coverImageUrl,
        bannerImageUrl: n.bannerImageUrl,
        status: this.mapAnimeStatus(n.status),
        format: n.format ? this.mapFormat(n.format) : undefined,
        source: n.source ? this.mapSource(n.source) : undefined,
        season: n.season ? this.mapSeason(n.season) : undefined,
        seasonYear: n.seasonYear,
        episodeCount: n.episodeCount,
        episodeDuration: n.episodeDuration,
        averageScore: n.averageScore ? new Prisma.Decimal(n.averageScore) : null,
        popularityScore: n.popularityScore,
        trailerUrl: n.trailerUrl,
        isAdult: n.isAdult,
        genres: {
          create: await this.resolveGenreConnects(n.genres),
        },
        studios: {
          create: await this.resolveStudioConnects(n.studios),
        },
        externalIds: {
          create: [{ provider, externalId }],
        },
      },
    });
  }

  private async updateAnime(id: number, n: NormalizedAnime) {
    await this.prisma.anime.update({
      where: { id },
      data: {
        titleEnglish: n.titleEnglish,
        titleNative: n.titleNative,
        synopsis: n.synopsis,
        coverImageUrl: n.coverImageUrl,
        bannerImageUrl: n.bannerImageUrl,
        status: this.mapAnimeStatus(n.status),
        episodeCount: n.episodeCount,
        averageScore: n.averageScore ? new Prisma.Decimal(n.averageScore) : null,
        popularityScore: n.popularityScore,
        trailerUrl: n.trailerUrl,
      },
    });
  }

  private async upsertEpisodes(
    animeId: number,
    animeTitleRomaji: string,
    episodes: NormalizedEpisode[],
  ): Promise<number> {
    let count = 0;

    for (const ep of episodes) {
      const slug = AnimeService.normalizeSlug(`${animeTitleRomaji}-episode-${ep.number}`);

      await this.prisma.episode.upsert({
        where: { animeId_number: { animeId, number: ep.number } },
        create: {
          animeId,
          slug,
          number: ep.number,
          title: ep.title,
          synopsis: ep.synopsis,
          thumbnailUrl: ep.thumbnailUrl,
          airDate: ep.airDate,
          airTimeUtc: ep.airTimeUtc,
          durationMinutes: ep.durationMinutes,
          status: this.mapEpisodeStatus(ep.status),
        },
        update: {
          title: ep.title,
          synopsis: ep.synopsis,
          thumbnailUrl: ep.thumbnailUrl,
          airDate: ep.airDate,
          airTimeUtc: ep.airTimeUtc,
          durationMinutes: ep.durationMinutes,
          status: this.mapEpisodeStatus(ep.status),
        },
      });
      count++;
    }

    return count;
  }

  private async upsertStreamingPlatforms(
    animeId: number,
    platforms: Array<{ site: string; url: string }>,
  ): Promise<void> {
    if (!platforms.length) return;

    for (const p of platforms) {
      const slug = AnimeService.normalizeSlug(p.site);
      const platform = await this.prisma.streamingPlatform.upsert({
        where: { slug },
        create: { name: p.site, slug, homepageUrl: p.url },
        update: { homepageUrl: p.url },
      });

      await this.prisma.animeStreamingPlatform.upsert({
        where: { animeId_platformId: { animeId, platformId: platform.id } },
        create: { animeId, platformId: platform.id, url: p.url },
        update: { url: p.url },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers: gêneros e estúdios (upsert por nome)
  // ---------------------------------------------------------------------------

  private async resolveGenreConnects(genres: string[]) {
    const result: Array<{ genreId: number }> = [];

    for (const name of genres) {
      const slug = AnimeService.normalizeSlug(name);
      const genre = await this.prisma.genre.upsert({
        where: { slug },
        create: { name, slug },
        update: { name },
      });
      result.push({ genreId: genre.id });
    }

    return result;
  }

  private async resolveStudioConnects(studios: Array<{ name: string; role: string | null }>) {
    const result: Array<{ studioId: number; role: string | null }> = [];

    for (const s of studios) {
      const studioSlug = AnimeService.normalizeSlug(s.name);
      const studio = await this.prisma.studio.upsert({
        where: { name: s.name },
        create: { name: s.name, slug: studioSlug },
        update: {},
      });
      result.push({ studioId: studio.id, role: s.role });
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Slug único
  // ---------------------------------------------------------------------------

  private async buildUniqueSlug(title: string): Promise<string> {
    const base = AnimeService.normalizeSlug(title);
    let slug = base;
    let counter = 1;

    while (await this.prisma.anime.count({ where: { slug } })) {
      slug = `${base}-${counter++}`;
    }

    return slug;
  }

  // ---------------------------------------------------------------------------
  // Mappers de enum
  // ---------------------------------------------------------------------------

  private mapAnimeStatus(raw: string): AnimeStatus {
    const map: Record<string, AnimeStatus> = {
      FINISHED: AnimeStatus.FINISHED,
      AIRING: AnimeStatus.AIRING,
      NOT_YET_AIRED: AnimeStatus.NOT_YET_AIRED,
      CANCELLED: AnimeStatus.CANCELLED,
      HIATUS: AnimeStatus.HIATUS,
    };
    return map[raw] ?? AnimeStatus.NOT_YET_AIRED;
  }

  private mapEpisodeStatus(raw: string): EpisodeStatus {
    const map: Record<string, EpisodeStatus> = {
      AIRED: EpisodeStatus.AIRED,
      UPCOMING: EpisodeStatus.UPCOMING,
    };
    return map[raw] ?? EpisodeStatus.UNKNOWN;
  }

  private mapFormat(raw: string): AnimeFormat | undefined {
    const map: Record<string, AnimeFormat> = {
      TV: AnimeFormat.TV,
      TV_SHORT: AnimeFormat.TV,
      MOVIE: AnimeFormat.MOVIE,
      SPECIAL: AnimeFormat.SPECIAL,
      OVA: AnimeFormat.OVA,
      ONA: AnimeFormat.ONA,
      MUSIC: AnimeFormat.MUSIC,
    };
    return map[raw];
  }

  private mapSource(raw: string): AnimeSourceKind | undefined {
    const map: Record<string, AnimeSourceKind> = {
      MANGA: AnimeSourceKind.MANGA,
      LIGHT_NOVEL: AnimeSourceKind.LIGHT_NOVEL,
      ORIGINAL: AnimeSourceKind.ORIGINAL,
      VISUAL_NOVEL: AnimeSourceKind.VISUAL_NOVEL,
      GAME: AnimeSourceKind.GAME,
      NOVEL: AnimeSourceKind.NOVEL,
      OTHER: AnimeSourceKind.OTHER,
    };
    return map[raw] ?? AnimeSourceKind.OTHER;
  }

  private mapSeason(raw: string): AnimeSeason | undefined {
    const map: Record<string, AnimeSeason> = {
      WINTER: AnimeSeason.WINTER,
      SPRING: AnimeSeason.SPRING,
      SUMMER: AnimeSeason.SUMMER,
      FALL: AnimeSeason.FALL,
    };
    return map[raw.toUpperCase()];
  }

  private mapProvider(source: string): ExternalProviderKind {
    const map: Record<string, ExternalProviderKind> = {
      anilist: ExternalProviderKind.ANILIST,
      mal: ExternalProviderKind.MYANIMELIST,
      jikan: ExternalProviderKind.JIKAN,
    };
    return map[source] ?? ExternalProviderKind.OTHER;
  }
}
