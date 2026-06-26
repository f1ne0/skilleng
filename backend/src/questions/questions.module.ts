import { Module } from "@nestjs/common";

import { LessonQuestionsController } from "./lesson-questions.controller";
import { QuestionsController } from "./questions.controller";
import { QuestionsService } from "./questions.service";

@Module({
  controllers: [LessonQuestionsController, QuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
