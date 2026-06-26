import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { CreateQuestionDto } from "./dto/create-question.dto";
import { ReorderQuestionsDto } from "./dto/reorder-questions.dto";
import { QuestionsService } from "./questions.service";

@ApiTags("Questions")
@Controller("lessons/:lessonId/questions")
export class LessonQuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  // ===== LIST (публичный, role-aware) =====
  @Get()
  @ApiOperation({
    summary:
      "List questions of a lesson (anonymous sees preview-only data, students see questions without answers)",
  })
  findAll(@Param("lessonId") lessonId: string) {
    return this.questionsService.findAllByLesson(lessonId);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "List questions as authenticated user",
  })
  findAllForMe(
    @Param("lessonId") lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.questionsService.findAllByLesson(lessonId, user.id);
  }

  // ===== CREATE =====
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a question (TEACHER owner of parent course)",
  })
  create(
    @Param("lessonId") lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateQuestionDto,
  ) {
    return this.questionsService.create(lessonId, user.id, dto);
  }

  // ===== REORDER =====
  @Post("reorder")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Reorder all questions in a lesson" })
  reorder(
    @Param("lessonId") lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReorderQuestionsDto,
  ) {
    return this.questionsService.reorder(lessonId, user.id, dto);
  }
}
