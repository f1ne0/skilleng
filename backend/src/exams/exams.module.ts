import { Module } from "@nestjs/common";

import { ContentModule } from "../content/content.module";
import { PrismaModule } from "../prisma/prisma.module";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";

@Module({
  imports: [PrismaModule, ContentModule],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}
