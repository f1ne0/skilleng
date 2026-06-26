import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { LessonsService } from "./lessons.service";

@ApiTags("Lessons")
@Controller("lessons")
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // ===== GET BY ID =====
  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get lesson by ID (access-controlled)" })
  findById(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.findById(id, user.id);
  }

  // ===== UPDATE =====
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update lesson (TEACHER owner of parent course)" })
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.lessonsService.update(id, user.id, dto);
  }

  // ===== DELETE =====
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete lesson (re-numbers remaining lessons)" })
  delete(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.delete(id, user.id);
  }

  // ===== PUBLISH =====
  @Post(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Publish lesson (DRAFT → PUBLISHED)" })
  publish(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.publish(id, user.id);
  }

  // ===== ARCHIVE =====
  @Post(":id/archive")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Archive lesson" })
  archive(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.lessonsService.archive(id, user.id);
  }

  // ===== MARK COMPLETED (student) =====
  @Post(":id/complete")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Mark lesson as completed (idempotent for repeated calls)",
  })
  markCompleted(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.markCompleted(id, user.id);
  }
}
