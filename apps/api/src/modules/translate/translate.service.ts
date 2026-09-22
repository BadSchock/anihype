import { BadGatewayException, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { cleanSynopsis, isPortugueseSynopsis } from '../../common/content/synopsis';
import { chunkText, detectSourceLang } from './translate.util';

export interface TranslationResult {
  translatedText: string;
  sourceLang: string;
  targetLang: 'pt' | 'en';
  alreadyInTarget: boolean;
}

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);

  /** Sinopse pronta para o site em português. Se a tradução falhar, devolve o texto limpo. */
  async toPortugueseSynopsis(raw: string | null | undefined): Promise<string | null> {
    const cleaned = cleanSynopsis(raw);
    if (!cleaned || isPortugueseSynopsis(cleaned)) return cleaned;

    try {
      const result = await this.translate(cleaned, 'pt');
      return cleanSynopsis(result.translatedText) ?? cleaned;
    } catch (err) {
      this.logger.warn(`Sinopse ficou no idioma original: ${String(err)}`);
      return cleaned;
    }
  }

  async translate(text: string, targetLang: 'pt' | 'en' = 'pt'): Promise<TranslationResult> {
    const sourceLang = detectSourceLang(text);
    if (sourceLang === targetLang) {
      return { translatedText: text, sourceLang, targetLang, alreadyInTarget: true };
    }

    const parts = await Promise.all(
      chunkText(text).map((chunk) => this.translateChunk(chunk, sourceLang, targetLang)),
    );

    return {
      translatedText: parts.join(''),
      sourceLang,
      targetLang,
      alreadyInTarget: false,
    };
  }

  private async translateChunk(text: string, sourceLang: string, targetLang: string): Promise<string> {
    try {
      const { data } = await axios.get<{
        responseStatus?: number;
        responseData?: { translatedText?: string };
      }>('https://api.mymemory.translated.net/get', {
        params: { q: text, langpair: `${sourceLang}|${targetLang}` },
        timeout: 8000,
      });

      const translated = data.responseData?.translatedText?.trim();
      if (!translated || data.responseStatus !== 200 || /MYMEMORY WARNING/i.test(translated)) {
        throw new Error('provider rejected translation');
      }
      return translated;
    } catch (err) {
      this.logger.warn(`Tradução falhou (${sourceLang}->${targetLang}): ${String(err)}`);
      throw new BadGatewayException('Não foi possível traduzir agora.');
    }
  }
}
