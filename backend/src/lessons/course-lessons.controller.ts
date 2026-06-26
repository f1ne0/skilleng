import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { ReorderLessonsDto } from "./dto/reorder-lessons.dto";
import { LessonsService } from "./lessons.service";

// Вложенный путь /courses/:courseId/lessons/...
@ApiTags("Lessons")
@Controller("courses/:courseId/lessons")
export class CourseLessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // ===== LIST =====
  // Публичный список с умной фильтрацией по роли/enrollment.
  // Юзер может быть аноним, студент, владелец курса — поведение разное.
  // ВАЖНО: используем UseGuards только если хотим знать кто юзер,
  // но не запрещать неавторизованным. Поэтому делаем optional auth pattern:
  // у нас пока такого нет — самый простой путь сделать публичным:
  @Get()
  @ApiOperation({ summary: "List lessons of a course (role-aware)" })
  findAll(@Param("courseId") courseId: string) {
    // Пока без юзера — анонимы видят только preview-уроки.
    // Позже можно сделать OptionalJwtAuthGuard, но это не критично.
    return this.lessonsService.findAllByCourse(courseId);
  }

  // Версия для авторизованных — видят больше (свои/записанные)
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List lessons as authenticated user (owner/enrolled view)",
  })
  findAllForMe(
    @Param("courseId") courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.lessonsService.findAllByCourse(courseId, user.id);
  }

  // ===== CREATE =====
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a lesson in a course (TEACHER owner)" })
  create(
    @Param("courseId") courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLessonDto,
  ) {
    return this.lessonsService.create(courseId, user.id, dto);
  }

  // ===== REORDER =====
  @Post("reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Reorder all lessons of a course (TEACHER owner)",
  })
  reorder(
    @Param("courseId") courseId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReorderLessonsDto,
  ) {
    return this.lessonsService.reorder(courseId, user.id, dto);
  }
}
