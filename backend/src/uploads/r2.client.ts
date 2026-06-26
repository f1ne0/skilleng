import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

@Injectable()
export class R2Client {
  private readonly logger = new Logger(R2Client.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const accountId = config.getOrThrow<string>("R2_ACCOUNT_ID");
    this.bucket = config.getOrThrow<string>("R2_BUCKET_NAME");
    this.publicUrl = config
      .getOrThrow<string>("R2_PUBLIC_URL")
      .replace(/\/$/, "");
    // убираем слеш в конце если есть — позже сами добавим

    this.client = new S3Client({
      region: "auto",
      // R2 требует "auto" — у них нет регионов в S3-смысле
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>("R2_ACCESS_KEY_ID"),
        secretAccessKey: config.getOrThrow<string>("R2_SECRET_ACCESS_KEY"),
      },
    });
  }

  /**
   * Генерирует временный URL для загрузки файла напрямую в R2.
   * Действует expiresIn секунд (по умолчанию 5 минут).
   */
  async generateUploadUrl(params: {
    key: string;
    mimeType: string;
    sizeBytes: number;
    expiresIn?: number;
  }): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      ContentType: params.mimeType,
      ContentLength: params.sizeBytes,
      // R2 проверит размер при загрузке. Если файл больше — отвергнет.
    });

    return getSignedUrl(this.client, command, {
      expiresIn: params.expiresIn ?? 300, // 5 минут
    });
  }

  /**
   * Серверная загрузка файла (минуя presigned URL).
   * Используется для системных файлов — TTS-кэш озвучки.
   */
  async putObject(params: {
    key: string;
    body: Buffer;
    mimeType: string;
  }): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: params.key,
        Body: params.body,
        ContentType: params.mimeType,
      }),
    );
  }

  /**
   * Проверяет, существует ли объект (для TTS-кэша:
   * перед генерацией смотрим, не озвучен ли уже этот текст этим голосом).
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Возвращает публичный URL для GET-доступа к файлу.
   * Формирует из R2_PUBLIC_URL + key.
   */
  getPublicUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }

  /**
   * Удаляет файл из R2. Используется когда юзер меняет аватар
   * или удаляет курс с обложкой.
   */
  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
    } catch (err) {
      this.logger.error(`Failed to delete object ${key}`, err);
      // Не пробрасываем — удаление best-effort.
      // Если упало — файл останется в R2 как "orphan", но это не критично.
    }
  }

  /**
   * Извлекает key из публичного URL (для удаления).
   * Например: "https://pub-xxx.r2.dev/avatars/abc.jpg" → "avatars/abc.jpg"
   */
  extractKeyFromUrl(url: string): string | null {
    if (!url.startsWith(this.publicUrl)) return null;
    return url.slice(this.publicUrl.length + 1); // +1 для слеша
  }
}
