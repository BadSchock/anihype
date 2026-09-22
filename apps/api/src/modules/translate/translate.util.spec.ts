import { chunkText, detectSourceLang } from './translate.util';

describe('translate.util', () => {
  it('detects Persian separately from Arabic', () => {
    expect(detectSourceLang('سلام، این قسمت خیلی خوب بود')).toBe('fa');
    expect(detectSourceLang('هذا تعليق')).toBe('ar');
    expect(detectSourceLang('Esse episódio foi ótimo')).toBe('pt');
  });

  it('splits long text under the provider byte limit', () => {
    const text = `${'palavra '.repeat(200)}fim`;
    const chunks = chunkText(text, 450);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => Buffer.byteLength(chunk, 'utf8') <= 450)).toBe(true);
    expect(chunks.join('')).toBe(text);
  });
});
