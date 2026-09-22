const MAX_CHUNK_BYTES = 450;

/** Best-effort source language for the translation provider. Portuguese is the site default. */
export function detectSourceLang(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) {
    return /[پچژگکی]/.test(text) ? 'fa' : 'ar';
  }
  if (/[\u3040-\u30ff]/.test(text)) return 'ja';
  if (/[\uac00-\ud7af]/.test(text)) return 'ko';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh-CN';
  if (/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/.test(text)) return 'pt';
  return 'en';
}

export function chunkText(text: string, maxBytes = MAX_CHUNK_BYTES): string[] {
  const chunks: string[] = [];
  let current = '';

  const pushHard = (value: string) => {
    let rest = value;
    while (Buffer.byteLength(rest, 'utf8') > maxBytes) {
      let end = rest.length;
      while (end > 1 && Buffer.byteLength(rest.slice(0, end), 'utf8') > maxBytes) {
        end -= 1;
      }
      chunks.push(rest.slice(0, end));
      rest = rest.slice(end);
    }
    current = rest;
  };

  for (const part of text.split(/(\s+)/)) {
    const next = current + part;
    if (Buffer.byteLength(next, 'utf8') <= maxBytes) {
      current = next;
      continue;
    }
    if (current.trim()) chunks.push(current);
    if (Buffer.byteLength(part, 'utf8') > maxBytes) {
      pushHard(part);
    } else {
      current = part;
    }
  }

  if (current.trim()) chunks.push(current);
  return chunks.length > 0 ? chunks : [text];
}
