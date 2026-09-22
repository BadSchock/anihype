import { isExplicitAdult, publicAnimeWhere } from './public-anime';

describe('public anime filter', () => {
  it('treats AniList isAdult and the Hentai genre as blocked', () => {
    expect(isExplicitAdult({ isAdult: true, genres: ['Action'] })).toBe(true);
    expect(isExplicitAdult({ isAdult: false, genres: ['Hentai'] })).toBe(true);
    expect(isExplicitAdult({ isAdult: false, genres: ['Ecchi', 'Comedy'] })).toBe(false);
  });

  it('excludes adult rows and the hentai genre from public queries', () => {
    expect(publicAnimeWhere()).toEqual({
      isAdult: false,
      genres: { none: { genre: { slug: 'hentai' } } },
    });
  });
});
