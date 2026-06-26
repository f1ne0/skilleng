import { Controller, Get, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { PrismaService } from "../prisma/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  // ===== ОБЩИЙ HEALTH =====
  // Используется uptime-мониторингом (UptimeRobot, BetterStack)
  @Get()
  @ApiOperation({ summary: "Health check with DB connection test" })
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
      };
    } catch {
      throw new ServiceUnavailableException("Database unavailable");
    }
  }

  // ===== LIVENESS =====
  // "процесс жив". Render/Railway/K8s используют для рестарта зависших процессов.
  // НЕ проверяем БД — даже если БД упала, процесс должен жить
  @Get("liveness")
  @ApiOperation({ summary: "Process is alive (no DB check)" })
  liveness() {
    return { status: "alive", uptime: process.uptime() };
  }

  // ===== READINESS =====
  // "готов принимать трафик". Если БД упала — НЕ готов
  // K8s/Render не будут слать на этот pod пока readiness не вернёт 200
  @Get("readiness")
  @ApiOperation({ summary: "Ready to serve traffic (DB check)" })
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ready" };
    } catch {
      throw new ServiceUnavailableException("Not ready");
    }
  }
}
