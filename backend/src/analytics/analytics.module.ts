import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
  // экспорт — AIModule подмешивает сводку прогресса в промпт тьютора
})
export class AnalyticsModule {}
