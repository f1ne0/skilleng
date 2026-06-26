import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
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
import { AddExamQuestionDto } from "./dto/add-exam-question.dto";
import { CreateExamDto } from "./dto/create-exam.dto";
import { GenerateExamDto } from "./dto/generate-exam.dto";
import { SubmitExamDto } from "./dto/submit-exam.dto";
import { UpdateExamDto } from "./dto/update-exam.dto";
import { ExamsService } from "./exams.service";

@ApiTags("Exams")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("exams")
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({ summary: "Экзамены курса (?courseId=) со статусом попытки" })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("courseId", ParseUUIDPipe) courseId: string,
  ) {
    return this.examsService.listForCourse(courseId, user.id);
  }

  @Post(":id/start")
  @ApiOperation({ summary: "Начать экзамен — вернуть вопросы (без ответов)" })
  start(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.examsService.start(id, user.id);
  }

  @Post("attempts/:attemptId/submit")
  @ApiOperation({ summary: "Сдать экзамен — авто-проверка, балл, разбивка" })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param("attemptId", ParseUUIDPipe) attemptId: string,
    @Body() dto: SubmitExamDto,
  ) {
    return this.examsService.submit(attemptId, user.id, dto);
  }

  // ===== TEACHER =====

  @Post()
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Создать экзамен для курса (TEACHER)" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExamDto) {
    return this.examsService.createForCourse(user.id, dto);
  }

  @Patch(":id")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Редактировать экзамен (TEACHER)" })
  updateExam(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateExamDto,
  ) {
    return this.examsService.updateExam(id, user.id, dto);
  }

  @Post(":id/questions")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Добавить один вопрос экзамена вручную (TEACHER)" })
  addQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddExamQuestionDto,
  ) {
    return this.examsService.addQuestion(id, user.id, dto);
  }

  @Delete("questions/:questionId")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Удалить один вопрос экзамена (TEACHER)" })
  removeQuestion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("questionId", ParseUUIDPipe) questionId: string,
  ) {
    return this.examsService.removeQuestion(questionId, user.id);
  }

  @Delete(":id")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Удалить экзамен (TEACHER)" })
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.examsService.remove(id, user.id);
  }

  @Post(":id/generate")
  @Roles(Role.TEACHER)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Сгенерировать вопросы экзамена по его юнитам (AI)" })
  generate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: GenerateExamDto,
  ) {
    return this.examsService.generateQuestions(id, user.id, dto.count ?? 10, dto.types);
  }

  @Get(":id")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Содержимое экзамена с ответами (для учителя)" })
  detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.examsService.getForTeacher(id, user.id);
  }

  @Get(":id/results")
  @Roles(Role.TEACHER)
  @ApiOperation({ summary: "Результаты экзамена по студентам (для учителя)" })
  results(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.examsService.results(id, user.id);
  }
}
