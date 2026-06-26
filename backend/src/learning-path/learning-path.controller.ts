import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { LearningPathService } from "./learning-path.service";

@ApiTags("Learning path")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("learning-path")
export class LearningPathController {
  constructor(private readonly learningPathService: LearningPathService) {}

  @Post("generate")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary:
      "Построить траекторию по level+goal (идемпотентно: пересоздаёт путь)",
  })
  generate(@CurrentUser() user: AuthenticatedUser) {
    return this.learningPathService.generateForUser(user.id);
  }

  @Get()
  @ApiOperation({ summary: "Текущий путь с прогрессом и статусами узлов" })
  async getMyPath(@CurrentUser() user: AuthenticatedUser) {
    const path = await this.learningPathService.getMyPath(user.id);
    // null = путь ещё не построен — фронт покажет CTA на генерацию
    return path ?? { exists: false };
  }
}
