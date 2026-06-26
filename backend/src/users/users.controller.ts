import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { OnboardingDto } from "./dto/onboarding.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UsersService } from "./users.service";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current user profile" })
  updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Post("me/onboarding")
  @ApiOperation({ summary: "Complete onboarding (set level, goal, interests)" })
  completeOnboarding(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: OnboardingDto,
  ) {
    return this.usersService.completeOnboarding(user.id, dto);
  }

  @Patch("me/password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Change current user password" })
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Delete("me")
  @ApiOperation({ summary: "Delete current user account (soft delete)" })
  deleteMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.deleteAccount(user.id);
  }
}
