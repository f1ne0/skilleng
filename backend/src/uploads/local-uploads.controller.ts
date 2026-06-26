import {
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { promises as fs, createReadStream } from "node:fs";
import * as path from "node:path";

import { STORAGE, type StorageDriver } from "./storage.driver";
import { LocalStorage } from "./local-storage.client";

const EXT_TO_MIME: Record<string, string> = {
  wav: "audio/wav",
  weba: "audio/webm",
  webm: "audio/webm",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Локальная загрузка/раздача файлов (offline-режим).
 * Активен только когда драйвер хранилища — LocalStorage; иначе маршруты 404.
 * key зашит в :id (base64url), поэтому без wildcard-маршрутов.
 */
@ApiExcludeController()
@Controller("uploads/local")
export class LocalUploadsController {
  constructor(@Inject(STORAGE) private readonly storage: StorageDriver) {}

  private local(): LocalStorage {
    if (!(this.storage instanceof LocalStorage)) {
      throw new NotFoundException();
    }
    return this.storage;
  }

  // ── PUT: загрузка по подписанному токену ──────────────────────
  @Put(":id")
  async upload(
    @Param("id") id: string,
    @Query("exp") exp: string,
    @Query("token") token: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const store = this.local();
    const key = store.decodeId(id);
    if (!key) throw new NotFoundException();
    if (!store.verifyToken(key, exp ?? "", token ?? "")) {
      throw new ForbiddenException("Invalid or expired upload token");
    }
    const file = store.resolve(key);
    if (!file) throw new NotFoundException();

    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      req.on("data", (c: Buffer) => chunks.push(c));
      req.on("end", () => resolve());
      req.on("error", reject);
    });

    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, Buffer.concat(chunks));
    res.status(200).json({ ok: true });
  }

  // ── GET: раздача файла ────────────────────────────────────────
  @Get(":id")
  async serve(
    @Param("id") id: string,
    @Res() res: Response,
  ): Promise<void> {
    const store = this.local();
    const key = store.decodeId(id);
    if (!key) throw new NotFoundException();
    const file = store.resolve(key);
    if (!file) throw new NotFoundException();

    try {
      await fs.access(file);
    } catch {
      throw new NotFoundException();
    }

    const ext = (file.split(".").pop() ?? "").toLowerCase();
    res.setHeader("Content-Type", EXT_TO_MIME[ext] ?? "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=86400");
    createReadStream(file).pipe(res);
  }
}
