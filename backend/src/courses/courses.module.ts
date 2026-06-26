import { Module } from "@nestjs/common";

import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";

@Module({
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
  // экспортируем — LessonsModule (Шаг 6) будет инжектить CoursesService
  // для проверки "существует ли курс при создании урока"
})
export class CoursesModule {}
