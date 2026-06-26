import { Module } from "@nestjs/common";

import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

@Module({
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
  // ВАЖНО: экспортируем — AnswersModule инжектит GamificationService
  // чтобы вызвать recordActivity() после правильного ответа.
})
export class GamificationModule {}
