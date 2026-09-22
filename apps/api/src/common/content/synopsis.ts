const PT_MARKERS =
  /\b(não|uma|para|como|está|estão|são|também|ela|ele|seu|sua|dos|das|pela|pelo|quando|muito|sobre)\b/gi;

/** Remove tags, entidades e o crédito "(Source: ...)" que o AniList deixa no texto. */
export function cleanSynopsis(raw: string | null | undefined): string | null {
  if (!raw) return null;

  const text = raw
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/\s*p\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s*\(Source:[^)]*\)\s*$/i, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  return text.length > 0 ? text : null;
}

/** O site está em português: uma sinopse com acento ou palavras comuns já pode ficar como está. */
export function isPortugueseSynopsis(text: string): boolean {
  if (/[áàâãéêíóôõúç]/i.test(text)) return true;
  return (text.match(PT_MARKERS)?.length ?? 0) >= 2;
}
