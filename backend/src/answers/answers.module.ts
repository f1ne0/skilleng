import { Module } from "@nestjs/common";

import { AnswersController } from "./answers.controller";
import { AnswersService } from "./answers.service";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
import { GamificationModule } from "../gamification/gamification.module";
import { AIModule } from "../ai/ai.module";
import { UploadsModule } from "../uploads/uploads.module";

@Module({
  imports: [GamificationModule, AIModule, UploadsModule],
  controllers: [AnswersController, ProgressController],
  providers: [AnswersService, ProgressService],
  exports: [AnswersService, ProgressService],
})
export class AnswersModule {}
