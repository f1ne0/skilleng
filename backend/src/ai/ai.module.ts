import { Module } from "@nestjs/common";

import { AnalyticsModule } from "../analytics/analytics.module";
import { AIController } from "./ai.controller";
import { AIService } from "./ai.service";
import { ConversationService } from "./conversation.service";
import { GeminiClient } from "./gemini.client";

@Module({
  imports: [AnalyticsModule],
  // analytics — сводка прогресса студента в промпте тьютора
  controllers: [AIController],
  providers: [GeminiClient, ConversationService, AIService],
  exports: [AIService, GeminiClient],
  // AIService — для AnswersModule (writing eval),
  // GeminiClient — для ContentModule (генерация контента, TTS)
})
export class AIModule {}
