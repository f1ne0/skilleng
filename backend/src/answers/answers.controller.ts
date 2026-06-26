import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { AnswersService } from "./answers.service";
import { SubmitAnswerDto } from "./dto/submit-answer.dto";

@ApiTags("Answers")
@Controller("questions/:questionId/answer")
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Submit an answer to a question",
    description:
      "Validates the answer server-side, awards XP on first correct attempt.",
  })
  submit(
    @Param("questionId") questionId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.answersService.submit(questionId, user.id, dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get my latest answer to this question" })
  findMyAnswer(
    @Param("questionId") questionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.answersService.findMyAnswer(questionId, user.id);
  }
}
