/**
 * Shared text moderation — censor improper language (do not block publish).
 * Site has no age gate; apply on all UGC over time (reviews first).
 */

/** PT-BR core list — extend as needed. Matching is case-insensitive. */
export const BLOCKED_WORDS: readonly string[] = [
  'tomar no cu',
  'vai tomar no cu',
  'cu',
  'porra',
  'caralho',
  'merda',
  'bosta',
  'puta',
  'puto',
  'putaria',
  'fdp',
  'vsf',
  'vtnc',
  'arrombado',
  'arrombada',
  'cuzão',
  'cuzao',
  'viado',
  'bicha',
  'buceta',
  'pênis',
  'penis',
  'piroca',
  'rola',
  'foder',
  'foda-se',
  'fodase',
  'filho da puta',
  'filha da puta',
  'desgraçado',
  'desgracado',
  'desgraçada',
  'desgracada',
  'retardado',
  'retardada',
  'mongol',
  'nazista',
  'estupro',
  'estuprar',
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces blocked tokens with asterisks of the same length.
 * Multi-word phrases are matched before single words (list order: longer first).
 */
export function censorText(input: string): { text: string; censored: boolean } {
  if (!input) {
    return { text: input, censored: false };
  }

  const sorted = [...BLOCKED_WORDS].sort((a, b) => b.length - a.length);
  let text = input;
  let censored = false;

  for (const word of sorted) {
    const escaped = escapeRegExp(word).replace(/\s+/g, '\\s+');
    // Boundaries: not a letter/number on either side (Unicode-aware)
    const re = new RegExp(`(?<![\\p{L}\\p{N}_])(${escaped})(?![\\p{L}\\p{N}_])`, 'giu');
    text = text.replace(re, (match) => {
      censored = true;
      return '*'.repeat(match.length);
    });
  }

  return { text, censored };
}
