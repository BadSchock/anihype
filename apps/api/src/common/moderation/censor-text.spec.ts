import { censorText } from './censor-text';

describe('censorText', () => {
  it('masks blocked words and keeps the rest', () => {
    const { text, censored } = censorText('Esse anime é uma merda completa');
    expect(censored).toBe(true);
    expect(text).toContain('*****');
    expect(text.toLowerCase()).not.toContain('merda');
    expect(text).toContain('anime');
  });

  it('leaves clean text unchanged', () => {
    const input = 'Obra-prima, absolute cinema';
    const { text, censored } = censorText(input);
    expect(censored).toBe(false);
    expect(text).toBe(input);
  });

  it('masks phrases like "vai tomar no cu"', () => {
    const { text, censored } = censorText('Vai tomar no cu.');
    expect(censored).toBe(true);
    expect(text.toLowerCase()).not.toContain('cu');
  });
});
