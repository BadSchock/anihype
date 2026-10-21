/** "Re: Zero" e "rezero" viram a mesma chave, sem pontuação nem acentos. */
export function compactSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function likeContains(value: string): string {
  const escaped = value.toLowerCase().replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}
