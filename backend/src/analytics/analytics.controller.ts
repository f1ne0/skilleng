import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import type { Response } from "express";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { AnalyticsService } from "./analytics.service";
import { TakeSnapshotDto } from "./dto/take-snapshot.dto";

@ApiTags("Analytics")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("student/:id")
  @ApiOperation({
    summary:
      "Прогресс студента: уровень, динамика, разбивка по навыкам (сам студент или владелец его группы)",
  })
  student(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.analyticsService.studentOverview(id, user.id);
  }

  @Get("group/:groupId")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Аналитика группы: студенты × навыки, средние" })
  group(
    @CurrentUser() user: AuthenticatedUser,
    @Param("groupId", ParseUUIDPipe) groupId: string,
  ) {
    return this.analyticsService.groupAnalytics(groupId, user.id);
  }

  @Post("snapshot")
  @Roles(Role.TEACHER)
  @ApiOperation({
    summary: "Зафиксировать срез PRE/POST/WEEKLY (PRE/POST не перезаписываются)",
  })
  snapshot(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TakeSnapshotDto,
  ) {
    return this.analyticsService.takeSnapshot(user.id, dto);
  }

  @Get("group/:groupId/export")
  @Roles(Role.TEACHER)
  @Header("Content-Type", "text/csv; charset=utf-8")
  @ApiOperation({ summary: "CSV-выгрузка группы (pre/post + навыки) для статистики" })
  async exportCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Param("groupId", ParseUUIDPipe) groupId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const csv = await this.analyticsService.exportGroupCsv(groupId, user.id);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="group-${groupId}-analytics.csv"`,
    );
    return csv;
  }
}
