// Абстракция хранилища файлов: либо облако (R2), либо локальный диск (offline).
// Обе реализации дают одинаковый интерфейс — сервис загрузок их не различает.

export const STORAGE = "STORAGE_DRIVER";

export interface StorageDriver {
  /** Временный URL для прямой загрузки файла (PUT) клиентом. */
  generateUploadUrl(params: {
    key: string;
    mimeType: string;
    sizeBytes: number;
    expiresIn?: number;
  }): Promise<string>;

  /** Серверная загрузка (например, TTS-кэш). */
  putObject(params: { key: string; body: Buffer; mimeType: string }): Promise<void>;

  /** Существует ли объект. */
  objectExists(key: string): Promise<boolean>;

  /** Публичный URL для GET-доступа. */
  getPublicUrl(key: string): string;

  /** Удалить объект (best-effort). */
  deleteObject(key: string): Promise<void>;

  /** Извлечь key из публичного URL (или null, если URL не наш). */
  extractKeyFromUrl(url: string): string | null;
}
