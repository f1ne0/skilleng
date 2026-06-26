import { Module } from "@nestjs/common";

import { LearningPathModule } from "../learning-path/learning-path.module";
import { PrismaModule } from "../prisma/prisma.module";
import { VocabularyController } from "./vocabulary.controller";
import { VocabularyService } from "./vocabulary.service";

@Module({
  imports: [PrismaModule, LearningPathModule],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}
