/**
 * Detecção de tipo de imagem por assinatura binária (magic bytes).
 *
 * Nunca confiar apenas na extensão do arquivo ou no `mimetype` declarado
 * pelo cliente — ambos podem ser forjados facilmente. Esta checagem lê os
 * primeiros bytes reais do arquivo enviado.
 *
 * SVG é intencionalmente NUNCA reconhecido aqui (é um formato baseado em
 * texto/XML e pode conter scripts — vetor clássico de XSS via upload).
 */
export type DetectedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export function detectImageMime(buffer: Buffer): DetectedImageMime | null {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}
