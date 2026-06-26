import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { UpdateQuestionDto } from "./dto/update-question.dto";
import { QuestionsService } from "./questions.service";

@ApiTags("Questions")
@Controller("questions")
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get question by ID (access-controlled)" })
  findById(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.questionsService.findById(id, user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update question (TEACHER owner)" })
  update(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questionsService.update(id, user.id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.TEACHER)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete question (re-numbers others)" })
  delete(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.questionsService.delete(id, user.id);
  }
}
