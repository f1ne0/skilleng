import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../prisma/prisma.service";

const BCRYPT_ROUNDS = 12;

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  level: true,
  goal: true,
  nativeLanguage: true,
  interests: true,
  avatarUrl: true,
  bio: true,
  onboardingCompleted: true,
  emailVerified: true,
  createdAt: true,
  lastLoginAt: true,
  totalXp: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName?: string;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email.trim().toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName.trim(),
        lastName: data.lastName?.trim() || null,
      },
    });
  }

  updateProfile(userId: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: PUBLIC_USER_SELECT,
    });
  }

  async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string },
  ): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException("User not found");
    }

    const matches = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    if (data.currentPassword === data.newPassword) {
      throw new BadRequestException(
        "New password must differ from current password",
      );
    }

    const newHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      // Revoke all active refresh tokens — user must re-login on other devices
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  async deleteAccount(userId: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new NotFoundException("User not found");
    }

    // Soft delete: deactivate + anonymize email (frees up email for re-registration)
    const anonEmail = `deleted-${userId}@deleted.local`;

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: anonEmail,
          firstName: "Deleted",
          lastName: null,
          avatarUrl: null,
          bio: null,
        },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  completeOnboarding(
    userId: string,
    data: {
      level: Prisma.UserUpdateInput["level"];
      goal: Prisma.UserUpdateInput["goal"];
      nativeLanguage?: string;
      interests?: string[];
    },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        level: data.level,
        goal: data.goal,
        nativeLanguage: data.nativeLanguage,
        interests: data.interests ?? [],
        onboardingCompleted: true,
      },
      select: PUBLIC_USER_SELECT,
    });
  }
}
