import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";

import { RequestUploadDto } from "./dto/request-upload.dto";
import { STORAGE, type StorageDriver } from "./storage.driver";
import { MIME_TO_EXT, UPLOAD_CONFIGS, UploadPurpose } from "./upload-config";

export interface UploadUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresInSec: number;
}

@Injectable()
export class UploadsService {
  constructor(@Inject(STORAGE) private readonly r2: StorageDriver) {}

  // ========== REQUEST UPLOAD URL ==========
  async requestUploadUrl(
    userId: string,
    dto: RequestUploadDto,
  ): Promise<UploadUrlResponse> {
    const config = UPLOAD_CONFIGS[dto.purpose];
    if (!config) {
      throw new BadRequestException(`Unknown purpose: ${dto.purpose}`);
    }

    // Системные назначения (TTS-кэш) заливает только бэкенд напрямую
    if (config.systemOnly) {
      throw new BadRequestException(
        `Purpose ${dto.purpose} is not available for direct upload`,
      );
    }

    // Проверяем размер
    if (dto.sizeBytes > config.maxBytes) {
      const maxMb = (config.maxBytes / (1024 * 1024)).toFixed(1);
      const submittedMb = (dto.sizeBytes / (1024 * 1024)).toFixed(1);
      throw new BadRequestException(
        `File too large: ${submittedMb} MB. Max allowed for ${dto.purpose}: ${maxMb} MB`,
      );
    }

    // Проверяем MIME-type
    if (!config.allowedMimeTypes.includes(dto.mimeType)) {
      throw new BadRequestException(
        `MIME type "${dto.mimeType}" not allowed for ${dto.purpose}. ` +
          `Allowed: ${config.allowedMimeTypes.join(", ")}`,
      );
    }

    // Генерируем ключ (путь в R2) на бэке.
    // Структура: avatars/<userId>/<uuid>.<ext>
    // Зачем userId в пути:
    // 1. Можно потом одним запросом найти все файлы юзера (для удаления при удалении аккаунта)
    // 2. Защита от коллизий между юзерами
    const ext = MIME_TO_EXT[dto.mimeType] ?? "bin";
    const uuid = randomUUID();
    const key = `${config.pathPrefix}/${userId}/${uuid}.${ext}`;

    // Генерируем pre-signed URL
    const uploadUrl = await this.r2.generateUploadUrl({
      key,
      mimeType: dto.mimeType,
      sizeBytes: dto.sizeBytes,
      expiresIn: 300, // 5 минут
    });

    return {
      uploadUrl,
      publicUrl: this.r2.getPublicUrl(key),
      key,
      expiresInSec: 300,
    };
  }

  // ========== TTS CACHE ==========
  // Системная озвучка: ключ детерминированный — sha256(text + voiceSignature).
  // Один и тот же текст одним голосом озвучивается ровно один раз.

  /** voiceSignature — имя голоса или строка вида "multi:Anna=Kore,Tom=Puck" */
  ttsCacheKey(text: string, voiceSignature: string, ext = "wav"): string {
    const hash = createHash("sha256")
      .update(`${voiceSignature}\n${text}`)
      .digest("hex");
    const prefix = UPLOAD_CONFIGS[UploadPurpose.TTS_CACHE].pathPrefix;
    return `${prefix}/${hash}.${ext}`;
  }

  /** Вернуть URL закэшированной озвучки или null, если её ещё нет */
  async ttsCacheLookup(key: string): Promise<string | null> {
    const exists = await this.r2.objectExists(key);
    return exists ? this.r2.getPublicUrl(key) : null;
  }

  /** Положить озвучку в кэш, вернуть публичный URL */
  async ttsCachePut(
    key: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    await this.r2.putObject({ key, body: buffer, mimeType });
    return this.r2.getPublicUrl(key);
  }

  // ========== DELETE BY URL ==========
  async deleteByUrl(publicUrl: string, requesterId: string): Promise<void> {
    const key = this.r2.extractKeyFromUrl(publicUrl);
    if (!key) {
      // URL не из нашего R2 — просто игнорируем, ничего удалять не надо
      return;
    }

    // Проверка владения через путь:
    // ключи устроены как "avatars/<userId>/...",
    // значит вторая часть пути — owner id
    const parts = key.split("/");
    if (parts.length < 3 || parts[1] !== requesterId) {
      // Юзер пытается удалить чужой файл — игнорируем
      // (не кидаем 403, чтобы не разглашать существование чужих файлов)
      return;
    }

    await this.r2.deleteObject(key);
  }
}
