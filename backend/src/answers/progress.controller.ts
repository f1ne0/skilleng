import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { ProgressService } from "./progress.service";

@ApiTags("Progress")
@Controller("progress")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get("courses/:courseId")
  @ApiOperation({ summary: "My progress in a course" })
  forCourse(
    @Param("courseId") courseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.forCourse(courseId, user.id);
  }

  @Get("lessons/:lessonId")
  @ApiOperation({ summary: "My progress in a lesson" })
  forLesson(
    @Param("lessonId") lessonId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.progressService.forLesson(lessonId, user.id);
  }

  @Get("recent-activity")
  @ApiOperation({
    summary: "Recent learning activity (completions + achievements)",
  })
  recentActivity(
    @CurrentUser() user: AuthenticatedUser,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.progressService.recentActivity(user.id, limit);
  }
}
