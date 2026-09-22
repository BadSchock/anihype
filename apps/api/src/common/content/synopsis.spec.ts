import { cleanSynopsis, isPortugueseSynopsis } from './synopsis';

describe('cleanSynopsis', () => {
  it('strips html tags and the source credit', () => {
    const raw =
      'Sheena meets a girl.<br><br>Mimi cannot die. <i>Secret</i> (Source: Kodansha USA)';
    expect(cleanSynopsis(raw)).toBe('Sheena meets a girl.\n\nMimi cannot die. Secret');
  });

  it('decodes entities', () => {
    expect(cleanSynopsis('Rock &amp; roll &#039;n&#039; roll')).toBe("Rock & roll 'n' roll");
  });

  it('returns null for empty input', () => {
    expect(cleanSynopsis(null)).toBeNull();
    expect(cleanSynopsis('   ')).toBeNull();
  });
});

describe('isPortugueseSynopsis', () => {
  it('recognizes Portuguese by accents or common words', () => {
    expect(isPortugueseSynopsis('Ela não quer mais conflito.')).toBe(true);
    expect(isPortugueseSynopsis('Uma garota para quem a morte é comum, como uma arma.')).toBe(true);
    expect(isPortugueseSynopsis('Death is nothing new to its residents.')).toBe(false);
  });
});