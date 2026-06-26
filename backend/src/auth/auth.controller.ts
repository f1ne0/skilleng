import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { CookieOptions, Request, Response } from "express";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../common/types/auth.types";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

// Refresh-токен живёт ТОЛЬКО в httpOnly-куке — JS на фронте его не видит,
// XSS не может украсть. В теле ответа отдаём только accessToken + user.
const REFRESH_COOKIE_NAME = "skilleng_refresh";
const REFRESH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней, как TTL токена

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: "Register a new user" })
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.register(dto, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Login with email + password" })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { refreshToken, ...result } = await this.authService.login(dto, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: "Exchange refresh token (httpOnly cookie) for new access token" })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = this.readRefreshCookie(req);
    if (!rawToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const { refreshToken, ...result } = await this.authService.refresh(
      rawToken,
      {
        userAgent: req.headers["user-agent"],
        ipAddress: req.ip,
      },
    );
    // Rotation: новый refresh — снова в куку
    this.setRefreshCookie(res, refreshToken);
    return result;
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke current refresh token" })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = this.readRefreshCookie(req);
    if (rawToken) {
      await this.authService.logout(rawToken);
    }
    this.clearRefreshCookie(res);
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Revoke all refresh tokens (logout from all devices)",
  })
  async logoutAll(
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.id);
    this.clearRefreshCookie(res);
  }

  // ========== COOKIE HELPERS ==========

  private cookieOptions(): CookieOptions {
    // ВАЖНО: если фронт и API на разных доменах (как onrender.com + отдельный
    // фронт-хостинг), браузер не пошлёт SameSite=strict куку на cross-site XHR.
    // Для такого деплоя выставь REFRESH_COOKIE_SAMESITE=none (требует Secure).
    const sameSite = (this.config.get<string>("REFRESH_COOKIE_SAMESITE") ??
      "strict") as CookieOptions["sameSite"];
    const isProduction = this.config.get<string>("NODE_ENV") === "production";

    return {
      httpOnly: true,
      secure: isProduction || sameSite === "none",
      sameSite,
      // Кука нужна только auth-эндпоинтам — не светим её на каждом запросе
      path: "/api/auth",
    };
  }

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE_NAME, token, {
      ...this.cookieOptions(),
      maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, this.cookieOptions());
  }

  private readRefreshCookie(req: Request): string | undefined {
    const cookies = req.cookies as Record<string, string> | undefined;
    return cookies?.[REFRESH_COOKIE_NAME];
  }
}
