import { Module } from "@nestjs/common";

import { LearningPathModule } from "../learning-path/learning-path.module";
import { CourseLessonsController } from "./course-lessons.controller";
import { LessonsController } from "./lessons.controller";
import { LessonsService } from "./lessons.service";

@Module({
  imports: [LearningPathModule],
  // learning-path: при завершении урока открывается следующий узел траектории
  controllers: [CourseLessonsController, LessonsController],
  // ДВА контроллера в одном модуле, оба используют LessonsService
  providers: [LessonsService],
  exports: [LessonsService],
  // экспортируем — Questions модуль (Шаг 7) будет инжектить
})
export class LessonsModule {}
