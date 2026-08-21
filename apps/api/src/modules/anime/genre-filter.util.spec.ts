import {
  parseGenreIdList,
  parseGenreSlugList,
  resolveEffectiveGenreIds,
  buildGenreAndConditions,
} from './genre-filter.util';

describe('genre-filter.util', () => {
  describe('parseGenreSlugList', () => {
    it('parses CSV and dedupes', () => {
      expect(parseGenreSlugList('acao, romance,acao')).toEqual(['acao', 'romance']);
    });

    it('returns empty for blank', () => {
      expect(parseGenreSlugList(undefined)).toEqual([]);
      expect(parseGenreSlugList('  ')).toEqual([]);
    });
  });

  describe('parseGenreIdList', () => {
    it('parses CSV ids', () => {
      expect(parseGenreIdList('1,2,2,3')).toEqual([1, 2, 3]);
    });

    it('drops invalid tokens', () => {
      expect(parseGenreIdList('1,abc,0,-2')).toEqual([1]);
    });
  });

  describe('resolveEffectiveGenreIds (G-U01–U03)', () => {
    it('G-U01: one genre id', () => {
      expect(
        resolveEffectiveGenreIds({
          slugsRequested: [],
          slugIdsFound: [],
          explicitIds: [5],
        }),
      ).toEqual([5]);
    });

    it('G-U02: two genres AND → both ids', () => {
      expect(
        resolveEffectiveGenreIds({
          slugsRequested: ['acao', 'fantasia'],
          slugIdsFound: [1, 2],
          explicitIds: [],
        }),
      ).toEqual([1, 2]);
    });

    it('G-U03: unknown slugs only → empty', () => {
      expect(
        resolveEffectiveGenreIds({
          slugsRequested: ['nao-existe'],
          slugIdsFound: [],
          explicitIds: [],
        }),
      ).toBe('empty');
    });

    it('ignores unknown slugs when some resolve', () => {
      expect(
        resolveEffectiveGenreIds({
          slugsRequested: ['acao', 'xyz'],
          slugIdsFound: [10],
          explicitIds: [],
        }),
      ).toEqual([10]);
    });

    it('no genre params → undefined', () => {
      expect(
        resolveEffectiveGenreIds({
          slugsRequested: [],
          slugIdsFound: [],
          explicitIds: [],
        }),
      ).toBeUndefined();
    });
  });

  describe('buildGenreAndConditions', () => {
    it('builds one some-clause per id for AND', () => {
      expect(buildGenreAndConditions([1, 2])).toEqual([
        { genres: { some: { genreId: 1 } } },
        { genres: { some: { genreId: 2 } } },
      ]);
    });
  });
});
