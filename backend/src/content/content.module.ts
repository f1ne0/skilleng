import { Module } from "@nestjs/common";

import { AIModule } from "../ai/ai.module";
import { UploadsModule } from "../uploads/uploads.module";
import { ContentController, TtsController } from "./content.controller";
import { ContentService } from "./content.service";

@Module({
  imports: [AIModule, UploadsModule],
  controllers: [ContentController, TtsController],
  providers: [ContentService],
  exports: [ContentService],
  // экспорт пригодится placement-модулю (Блок 3) для наполнения банка
})
export class ContentModule {}
