import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, unlink, writeFile } from 'fs/promises';
import path from 'path';

/**
 * Pasta padrão: apps/api/uploads.
 * Funciona tanto com o arquivo compilado em dist/ quanto se o serviço
 * for carregado a partir de src/.
 */
export function resolveAvatarUploadRoot(configured?: string): string {
  if (configured?.trim()) {
    return path.resolve(configured.trim());
  }

  return path.resolve(__dirname, '../../../uploads');
}

/**
 * Abstração de storage de avatar. O restante do módulo `users` só chama
 * upload/delete. Hoje grava no disco da API; Cloudflare ou S3 entram
 * trocando esta classe, sem mudar o controller.
 */
@Injectable()
export class AvatarStorageService {
  private readonly logger = new Logger(AvatarStorageService.name);
  private readonly uploadRoot: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.uploadRoot = resolveAvatarUploadRoot(this.config.get<string>('avatarStorage.uploadDir'));
    this.publicUrl = (
      this.config.get<string>('avatarStorage.publicUrl') ?? 'http://localhost:3001/uploads'
    ).replace(/\/+$/, '');

    if (
      this.config.get<string>('app.nodeEnv') === 'production' &&
      !process.env['AVATAR_PUBLIC_URL']
    ) {
      this.logger.warn(
        'AVATAR_PUBLIC_URL não definida. Avatares vão apontar para localhost e não abrem no site público. ' +
          'Defina a URL da API, por exemplo https://api.anihype.com.br/uploads.',
      );
    }
  }

  /** Grava o arquivo e devolve a URL pública. A key é sempre gerada pelo serviço de usuário. */
  async upload(key: string, body: Buffer, _contentType: string): Promise<string> {
    const target = this.resolveInsideRoot(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
    return `${this.publicUrl}/${key}`;
  }

  /** Remoção best-effort. Arquivo ausente não interrompe a troca de avatar. */
  async delete(key: string): Promise<void> {
    try {
      await unlink(this.resolveInsideRoot(key));
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') return;
      this.logger.warn(`Falha ao remover avatar antigo (key=${key}): ${(err as Error).message}`);
    }
  }

  /**
   * Se a URL for de um arquivo que nós mesmos gravamos, devolve a key.
   * URL externa (avatar antigo de outro lugar) devolve null e não é apagada.
   */
  extractManagedKey(url: string | null | undefined): string | null {
    if (!url) return null;
    const prefix = `${this.publicUrl}/`;
    if (!url.startsWith(prefix)) return null;

    const key = url.slice(prefix.length);
    if (!this.isSafeKey(key)) return null;
    return key;
  }

  private resolveInsideRoot(key: string): string {
    if (!this.isSafeKey(key)) {
      throw new Error('Chave de avatar inválida');
    }

    const root = path.resolve(this.uploadRoot);
    const target = path.resolve(root, key);
    if (target !== root && !target.startsWith(root + path.sep)) {
      throw new Error('Chave de avatar fora da pasta permitida');
    }
    return target;
  }

  private isSafeKey(key: string): boolean {
    return /^avatars\/\d+\/[0-9a-f-]{36}\.webp$/i.test(key);
  }
}
