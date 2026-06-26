import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { LeaderboardQueryDto } from "./dto/leaderboard-query.dto";
import { GamificationService } from "./gamification.service";

@ApiTags("Gamification")
@Controller("gamification")
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "My gamification info (XP, level, streak, achievements summary)",
  })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.gamificationService.getMyGamificationInfo(user.id);
  }

  @Get("achievements")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "All achievements with my unlock status",
  })
  getAchievements(@CurrentUser() user: AuthenticatedUser) {
    return this.gamificationService.getAllAchievementsWithProgress(user.id);
  }

  @Get("leaderboard")
  @ApiOperation({
    summary: "Global leaderboard (no auth required)",
    description: "Use period=all for total XP, period=week for last 7 days",
  })
  // ВНИМАНИЕ: лидерборд публичный — НЕ требует аутентификации.
  // Если хочешь сделать приватным — добавь @UseGuards(JwtAuthGuard).
  getLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.gamificationService.getLeaderboard(
      query.period ?? "all",
      query.limit,
      query.userId,
    );
  }
}
