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
import { IsString, MaxLength, MinLength } from "class-validator";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { AIService } from "./ai.service";
import { ConversationService } from "./conversation.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { ExplainAnswerDto } from "./dto/explain-answer.dto";
import { LiveFeedbackDto } from "./dto/live-feedback.dto";
import { SendMessageDto } from "./dto/send-message.dto";

class RenameConversationDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;
}

@ApiTags("AI")
@Controller("ai")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AIController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly aiService: AIService,
  ) {}

  // ===== CHAT =====
  @Post("conversations")
  @ApiOperation({ summary: "Create a new AI chat conversation" })
  createConversation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationService.create(user.id, dto);
  }

  @Get("conversations")
  @ApiOperation({ summary: "List my conversations" })
  findMy(@CurrentUser() user: AuthenticatedUser) {
    return this.conversationService.findMine(user.id);
  }

  @Get("conversations/:id")
  @ApiOperation({ summary: "Get conversation with full message history" })
  findOne(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.conversationService.findById(id, user.id);
  }

  @Post("conversations/:id/messages")
  @ApiOperation({ summary: "Send a message in conversation, get AI response" })
  sendMessage(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversationService.sendMessage(id, user.id, dto);
  }

  @Patch("conversations/:id")
  @ApiOperation({ summary: "Rename conversation" })
  renameConversation(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RenameConversationDto,
  ) {
    return this.conversationService.rename(id, user.id, dto.title);
  }

  @Delete("conversations/:id")
  @ApiOperation({ summary: "Delete conversation" })
  deleteConversation(
    @Param("id") id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.conversationService.delete(id, user.id);
  }

  // ===== LIVE WRITING FEEDBACK =====
  @Post("writing/live-feedback")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary:
      "Debounced-фидбек по черновику письма (прогноз score + подсказки). НЕ сохраняется",
  })
  liveFeedback(@Body() dto: LiveFeedbackDto) {
    return this.aiService.liveWritingFeedback(dto);
  }

  // ===== EXPLAIN ANSWER =====
  @Post("explain")
  @ApiOperation({ summary: "Get AI explanation for an incorrect answer" })
  async explain(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ExplainAnswerDto,
  ) {
    const explanation = await this.aiService.explainAnswer(user.id, dto);
    return { explanation };
  }
}
