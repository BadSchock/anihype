const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  rsquo: '\u2019',
  lsquo: '\u2018',
  rdquo: '\u201d',
  ldquo: '\u201c',
};

function decodeHtmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, entity: string) => {
    if (entity[0] === '#') {
      const hex = entity[1] === 'x' || entity[1] === 'X';
      const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(code) || code < 0 || code > 0x10ffff) return full;
      return String.fromCodePoint(code);
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? full;
  });
}

/** Remove HTML, markdown e a marcação de fonte que AniList e MyAnimeList enviam. */
export function formatSynopsisText(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;

  let text = raw.replace(/\r\n/g, '\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');
  text = text.replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n');
  text = text.replace(/<li[^>]*>/gi, '\n• ');
  text = text.replace(/<[^>]+>/g, '');
  text = decodeHtmlEntities(text);

  text = text.replace(/~!([\s\S]+?)!~/g, '$1');
  text = text.replace(/__([\s\S]+?)__/g, '$1');
  text = text.replace(/\*\*([\s\S]+?)\*\*/g, '$1');
  text = text.replace(/(^|[\s(])_([^_\n]+)_/g, '$1$2');
  text = text.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1$2');
  text = text.replace(/\[Written by MAL Rewrite\]/gi, '');

  let source: string | null = null;
  const sourceMatch = text.match(/\(\s*Source:\s*([^)]+?)\s*\)/i);
  if (sourceMatch?.[1]) {
    source = sourceMatch[1].replace(/\s+/g, ' ').trim();
    text = text.replace(sourceMatch[0], '');
  }

  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const fonteMatch = text.match(/(?:^|\n)Fonte:\s*(.+)\s*$/i);
  if (fonteMatch?.[1] && !source) {
    source = fonteMatch[1].trim();
    text = text.slice(0, fonteMatch.index).trim();
  }

  if (!text) return null;
  return source ? `${text}\n\nFonte: ${source}` : text;
}
