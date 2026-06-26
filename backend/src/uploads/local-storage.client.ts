import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";

import type { StorageDriver } from "./storage.driver";

/**
 * Локальное файловое хранилище — для работы без интернета.
 * Файлы лежат на диске бэкенда; ключ кодируется в один URL-параметр
 * (base64url), поэтому маршруты простые, без wildcard.
 * URL загрузки подписан HMAC-токеном с TTL (аналог presigned URL).
 */
@Injectable()
export class LocalStorage implements StorageDriver {
  private readonly logger = new Logger(LocalStorage.name);
  private readonly baseDir: string;
  private readonly publicBase: string;
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.baseDir =
      config.get<string>("LOCAL_STORAGE_DIR") ??
      path.join(process.cwd(), "storage");
    this.publicBase = (
      config.get<string>("BACKEND_PUBLIC_URL") ?? "http://localhost:3000"
    ).replace(/\/$/, "");
    this.secret =
      config.get<string>("UPLOAD_SECRET") ??
      config.get<string>("JWT_SECRET") ??
      "dev-local-upload-secret";
  }

  // ── публичные методы драйвера ─────────────────────────────────
  async generateUploadUrl(params: {
    key: string;
    mimeType: string;
    sizeBytes: number;
    expiresIn?: number;
  }): Promise<string> {
    const exp = Date.now() + (params.expiresIn ?? 300) * 1000;
    const token = this.sign(params.key, exp);
    return `${this.fileUrl(params.key)}?exp=${exp}&token=${token}`;
  }

  async putObject(params: {
    key: string;
    body: Buffer;
    mimeType: string;
  }): Promise<void> {
    const file = this.resolve(params.key);
    if (!file) throw new Error("Invalid storage key");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, params.body);
  }

  async objectExists(key: string): Promise<boolean> {
    const file = this.resolve(key);
    if (!file) return false;
    try {
      await fs.access(file);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return this.fileUrl(key);
  }

  async deleteObject(key: string): Promise<void> {
    const file = this.resolve(key);
    if (!file) return;
    try {
      await fs.unlink(file);
    } catch (err) {
      this.logger.warn(`Failed to delete ${key}: ${String(err)}`);
    }
  }

  extractKeyFromUrl(url: string): string | null {
    const prefix = `${this.publicBase}/api/uploads/local/`;
    const noQuery = url.split("?")[0];
    if (!noQuery.startsWith(prefix)) return null;
    return this.decodeId(noQuery.slice(prefix.length));
  }

  // ── для контроллера ───────────────────────────────────────────
  /** Проверка подписи токена загрузки. */
  verifyToken(key: string, exp: string, token: string): boolean {
    const expNum = Number(exp);
    if (!Number.isFinite(expNum) || Date.now() > expNum) return false;
    return token === this.sign(key, expNum);
  }

  /** Безопасный путь на диске для ключа (защита от path traversal). */
  resolve(key: string): string | null {
    const root = path.resolve(this.baseDir);
    const file = path.resolve(root, key);
    if (file !== root && !file.startsWith(root + path.sep)) return null;
    return file;
  }

  /** base64url-id → key */
  decodeId(id: string): string | null {
    try {
      return Buffer.from(id, "base64url").toString("utf8");
    } catch {
      return null;
    }
  }

  // ── приватное ─────────────────────────────────────────────────
  private fileUrl(key: string): string {
    // /api — глобальный префикс NestJS (app.setGlobalPrefix("api"))
    const id = Buffer.from(key, "utf8").toString("base64url");
    return `${this.publicBase}/api/uploads/local/${id}`;
  }

  private sign(key: string, exp: number): string {
    return createHmac("sha256", this.secret)
      .update(`${key}|${exp}`)
      .digest("hex")
      .slice(0, 32);
  }
}
