import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomBytes, createHash } from "node:crypto";

import { PrismaService } from "../prisma/prisma.service";
import { JwtPayload } from "../common/types/auth.types";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { StringValue } from "ms";

const BCRYPT_ROUNDS = 12;
const REFRESH_TOKEN_TTL_DAYS = 30;
const REFRESH_TOKEN_BYTES = 64;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ========== REGISTER ==========
  async register(
    dto: RegisterDto,
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    const email = dto.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName?.trim() || null,
        },
      });

      const tokens = await this.issueTokens(
        user.id,
        user.email,
        user.role,
        meta,
      );

      return {
        ...tokens,
        user: this.toPublicUser(user),
      };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new BadRequestException("Email already registered");
      }
      throw err;
    }
  }

  // ========== LOGIN ==========
  async login(dto: LoginDto, meta: { userAgent?: string; ipAddress?: string }) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Обновляем lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.email, user.role, meta);

    return {
      ...tokens,
      user: this.toPublicUser(user),
    };
  }

  // ========== REFRESH ==========
  async refresh(
    rawToken: string,
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    const tokenHash = this.hashToken(rawToken);

    // Ищем токен по хэшу
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (stored.revokedAt) {
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token expired");
    }

    if (!stored.user.isActive) {
      throw new UnauthorizedException("Account is inactive");
    }

    // ROTATION: отзываем старый токен, выпускаем новые
    // Это best practice — если злоумышленник украл refresh,
    // легитимный юзер скоро не сможет им воспользоваться, что подаст сигнал
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.role,
      meta,
    );

    return {
      ...tokens,
      user: this.toPublicUser(stored.user),
    };
  }

  // ========== LOGOUT ==========
  async logout(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);

    try {
      await this.prisma.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Токен не найден — это нормально, юзер мог дважды нажать "выйти"
    }
  }

  // ========== LOGOUT FROM ALL DEVICES ==========
  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ========== HELPERS ==========

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    meta: { userAgent?: string; ipAddress?: string },
  ) {
    // Access token (короткий, JWT)
    const payload: JwtPayload = { sub: userId, email, role: role as never };
    const accessTokenExpiry = (this.config.get<string>(
      "JWT_ACCESS_EXPIRES_IN",
    ) ?? "15m") as StringValue;

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: accessTokenExpiry,
    });

    // Refresh token (длинный, opaque, хранится в БД)
    const rawRefreshToken =
      randomBytes(REFRESH_TOKEN_BYTES).toString("base64url");
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        userAgent: meta.userAgent?.slice(0, 500),
        ipAddress: meta.ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      // ВАЖНО: возвращаем сырой токен ТОЛЬКО клиенту, в БД лежит только хэш
    };
  }

  private hashToken(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
  }

  private toPublicUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    role: string;
    level: string | null;
    goal: string | null;
    nativeLanguage: string | null;
    interests: string[];
    avatarUrl: string | null;
    bio: string | null;
    onboardingCompleted: boolean;
    emailVerified: boolean;
    createdAt: Date;
    lastLoginAt: Date | null;
    totalXp?: number;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      level: user.level,
      goal: user.goal,
      nativeLanguage: user.nativeLanguage,
      interests: user.interests,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      onboardingCompleted: user.onboardingCompleted,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      totalXp: user.totalXp,
    };
  }
}
