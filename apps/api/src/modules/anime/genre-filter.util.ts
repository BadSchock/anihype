import type { Prisma } from '@prisma/client';

/** Parse CSV of genre slugs from `?genre=acao,romance`. */
export function parseGenreSlugList(genre?: string): string[] {
  if (!genre?.trim()) return [];
  return [
    ...new Set(
      genre
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

/** Parse CSV of numeric ids from `?genreIds=1,2,3`. */
export function parseGenreIdList(genreIds?: string): number[] {
  if (!genreIds?.trim()) return [];
  return [
    ...new Set(
      genreIds
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n) && n > 0),
    ),
  ];
}

/**
 * Merge slug lookups + explicit ids.
 * - No genre params → undefined (no filter)
 * - Slugs requested but none found (and no explicit ids) → 'empty'
 * - Otherwise unique id list for AND filter
 */
export function resolveEffectiveGenreIds(opts: {
  slugsRequested: string[];
  slugIdsFound: number[];
  explicitIds: number[];
}): number[] | 'empty' | undefined {
  const { slugsRequested, slugIdsFound, explicitIds } = opts;
  if (slugsRequested.length === 0 && explicitIds.length === 0) {
    return undefined;
  }
  if (slugsRequested.length > 0 && slugIdsFound.length === 0 && explicitIds.length === 0) {
    return 'empty';
  }
  const ids = [...new Set([...explicitIds, ...slugIdsFound])];
  if (ids.length === 0) return 'empty';
  return ids;
}

/** One Prisma AND clause per genre id (anime must have ALL). */
export function buildGenreAndConditions(genreIds: number[]): Prisma.AnimeWhereInput[] {
  return genreIds.map((genreId) => ({ genres: { some: { genreId } } }));
}
