/**
 * Client-side display safety net (same rules as API).
 * Keep in sync with apps/api/src/common/moderation/censor-text.ts
 */

const BLOCKED_WORDS: readonly string[] = [
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
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function censorText(input: string): string {
  if (!input) return input;
  const sorted = [...BLOCKED_WORDS].sort((a, b) => b.length - a.length);
  let text = input;
  for (const word of sorted) {
    const escaped = escapeRegExp(word).replace(/\s+/g, '\\s+');
    const re = new RegExp(`(?<![\\p{L}\\p{N}_])(${escaped})(?![\\p{L}\\p{N}_])`, 'giu');
    text = text.replace(re, (match) => '*'.repeat(match.length));
  }
  return text;
}
