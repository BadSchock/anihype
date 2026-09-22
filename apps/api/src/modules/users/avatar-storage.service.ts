import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * Abstração de storage de avatar. Controller/service do módulo `users`
 * não conhecem detalhes do Cloudflare R2 — só chamam `upload`/`delete`.
 *
 * Se as variáveis R2_* não estiverem configuradas, o serviço sobe
 * normalmente (não quebra o boot da API) mas `upload()` responde 503.
 */
@Injectable()
export class AvatarStorageService {
  private readonly logger = new Logger(AvatarStorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket?: string;
  private readonly publicUrl?: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('r2.accountId');
    const accessKeyId = this.config.get<string>('r2.accessKeyId');
    const secretAccessKey = this.config.get<string>('r2.secretAccessKey');
    this.bucket = this.config.get<string>('r2.bucket');
    this.publicUrl = this.config.get<string>('r2.publicUrl');

    if (accountId && accessKeyId && secretAccessKey && this.bucket && this.publicUrl) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
    } else {
      this.client = null;
      this.logger.warn(
        'Cloudflare R2 não configurado (R2_ACCOUNT_ID/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/R2_BUCKET/R2_PUBLIC_URL). ' +
          'Upload de avatar ficará indisponível (503) até configurar essas variáveis.',
      );
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  /** Sobe o objeto e retorna a URL pública final. */
  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    if (!this.client || !this.bucket || !this.publicUrl) {
      throw new ServiceUnavailableException(
        'Upload de avatar está temporariamente indisponível. Tente novamente mais tarde.',
      );
    }

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return `${this.publicUrl.replace(/\/+$/, '')}/${key}`;
  }

  /** Remoção best-effort — falhas aqui nunca devem quebrar o fluxo principal. */
  async delete(key: string): Promise<void> {
    if (!this.client || !this.bucket) return;

    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      this.logger.warn(
        `Falha ao remover avatar antigo do R2 (key=${key}): ${(err as Error).message}`,
      );
    }
  }

  /**
   * Se a URL pertencer ao nosso bucket público (avatar gerenciado por nós),
   * retorna a key do objeto. Caso contrário (URL externa/legado), retorna
   * null — nunca tentamos apagar algo que não subimos.
   */
  extractManagedKey(url: string | null | undefined): string | null {
    if (!url || !this.publicUrl) return null;
    const prefix = `${this.publicUrl.replace(/\/+$/, '')}/`;
    if (!url.startsWith(prefix)) return null;
    return url.slice(prefix.length);
  }
}
