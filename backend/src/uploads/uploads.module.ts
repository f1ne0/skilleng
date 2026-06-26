import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { R2Client } from "./r2.client";
import { LocalStorage } from "./local-storage.client";
import { STORAGE, type StorageDriver } from "./storage.driver";
import { UploadsController } from "./uploads.controller";
import { LocalUploadsController } from "./local-uploads.controller";
import { UploadsService } from "./uploads.service";

// Выбор драйвера хранилища:
//   STORAGE_DRIVER=r2|local — явно;
//   иначе: r2, если заданы R2-переменные, иначе local (offline).
const storageProvider = {
  provide: STORAGE,
  inject: [ConfigService],
  useFactory: (config: ConfigService): StorageDriver => {
    const explicit = config.get<string>("STORAGE_DRIVER");
    const hasR2 = Boolean(config.get<string>("R2_ACCOUNT_ID"));
    const driver = explicit ?? (hasR2 ? "r2" : "local");
    return driver === "r2" ? new R2Client(config) : new LocalStorage(config);
  },
};

@Module({
  controllers: [UploadsController, LocalUploadsController],
  providers: [storageProvider, UploadsService],
  exports: [STORAGE, UploadsService],
  // экспортируем STORAGE — другие модули чистят/валидируют файлы
})
export class UploadsModule {}
