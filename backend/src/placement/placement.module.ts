import { Module } from "@nestjs/common";

import { ContentModule } from "../content/content.module";
import { LearningPathModule } from "../learning-path/learning-path.module";
import { PrismaModule } from "../prisma/prisma.module";
import { PlacementController } from "./placement.controller";
import { PlacementService } from "./placement.service";

@Module({
  imports: [PrismaModule, ContentModule, LearningPathModule],
  controllers: [PlacementController],
  providers: [PlacementService],
  exports: [PlacementService],
})
export class PlacementModule {}
