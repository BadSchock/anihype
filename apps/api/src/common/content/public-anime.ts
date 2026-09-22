import { Prisma } from '@prisma/client';

const HENTAI_GENRE = 'hentai';

/** Hentai e demais títulos 18+ ficam fora das superfícies públicas. Não há verificação de idade. */
export function isExplicitAdult(input: { isAdult: boolean; genres: string[] }): boolean {
  if (input.isAdult) return true;
  return input.genres.some((name) => name.trim().toLowerCase() === HENTAI_GENRE);
}

export function publicAnimeWhere(): Prisma.AnimeWhereInput {
  return {
    isAdult: false,
    genres: { none: { genre: { slug: HENTAI_GENRE } } },
  };
}
