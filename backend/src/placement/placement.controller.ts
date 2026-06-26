import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Throttle } from "@nestjs/throttler";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { AnswerPlacementDto } from "./dto/answer-placement.dto";
import { SeedBankDto } from "./dto/seed-bank.dto";
import { PlacementService } from "./placement.service";

@ApiTags("Placement")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("placement")
export class PlacementController {
  constructor(private readonly placementService: PlacementService) {}

  // --- банк (TEACHER) — статические маршруты до ":id" ---

  @Post("bank/seed")
  @Roles(Role.TEACHER)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @ApiOperation({ summary: "Наполнить банк AI-генерацией по всем уровням" })
  seedBank(@Body() dto: SeedBankDto) {
    return this.placementService.seedBank(dto.perLevel ?? 5);
  }

  @Get("bank/stats")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Размер банка по уровням" })
  bankStats() {
    return this.placementService.bankStats();
  }

  // --- тест (любой залогиненный) ---

  @Post("start")
  @ApiOperation({
    summary: "Начать (или продолжить незавершённый) адаптивный тест",
  })
  start(@CurrentUser() user: AuthenticatedUser) {
    return this.placementService.start(user.id);
  }

  @Post(":id/answer")
  @ApiOperation({
    summary: "Ответить на текущий вопрос → следующий вопрос или результат",
  })
  answer(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AnswerPlacementDto,
  ) {
    return this.placementService.answer(id, user.id, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Состояние теста (+траектория ability)" })
  getState(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.placementService.getState(id, user.id);
  }
}
