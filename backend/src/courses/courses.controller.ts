import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { CoursesService } from "./courses.service";
import { CourseFilterDto } from "./dto/course-filter.dto";
import { CreateCourseDto } from "./dto/create-course.dto";
import { CreateGeneratedCourseDto } from "./dto/create-generated-course.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

@ApiTags("Courses")
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ====== ПУБЛИЧНЫЕ ЭНДПОИНТЫ ======
  // НИ JwtAuthGuard, ни Roles — открыты для всех (даже без логина)

  @Get()
  @ApiOperation({ summary: "List published courses (catalog with filters)" })
  findAll(@Query() filter: CourseFilterDto) {
    // @Query() — извлечь query params как DTO.
    // ValidationPipe + @Type(() => Number) в DTO конвертят строки в числа.
    return this.coursesService.findAll(filter);
  }

  @Get("slug/:slug")
  @ApiOperation({ summary: "Get course by slug (public page)" })
  findBySlug(@Param("slug") slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  // ====== АУТЕНТИФИЦИРОВАННЫЕ ЭНДПОИНТЫ ======
  // ВАЖНО: 'my' идёт ДО ':id', иначе Express бы попытался
  // подставить 'my' как параметр :id

  @Get("my")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "My courses (teacher: owned, student: enrolled)",
  })
  findMy(@CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.findMyCourses(user.id, user.role);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get course by ID" })
  findById(@Param("id") id: string) {
    return this.coursesService.findById(id);
  }

  // ====== TEACHER-ONLY ЭНДПОИНТЫ ======

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  // ПОРЯДОК ВАЖЕН: сначала JwtAuthGuard (положит юзера в request.user),
  // потом RolesGuard (прочитает роль)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new course (TEACHER only)" })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(user.id, dto);
  }

  @Post("generated")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Save an AI-generated course with lessons + questions (TEACHER)" })
  createGenerated(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGeneratedCourseDto,
  ) {
    return this.coursesService.createGenerated(user.id, dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update course (TEACHER only, owner check)" })
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, user.id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete course (TEACHER only, owner check)" })
  delete(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.delete(id, user.id);
  }

  @Post(":id/publish")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Publish course (DRAFT → PUBLISHED)" })
  publish(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.publish(id, user.id);
  }

  @Post(":id/archive")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Archive course (PUBLISHED → ARCHIVED)" })
  archive(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.archive(id, user.id);
  }

  // ====== STUDENT-ONLY ENROLLMENT ======

  @Post(":id/enroll")
  @UseGuards(JwtAuthGuard)
  // БЕЗ RolesGuard — и STUDENT, и TEACHER могут записываться на чужие курсы
  // (TEACHER тоже может проходить курсы коллег)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Enroll in course" })
  enroll(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.enroll(id, user.id);
  }

  @Delete(":id/enroll")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Unenroll from course" })
  unenroll(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.coursesService.unenroll(id, user.id);
  }
}
