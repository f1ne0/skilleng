import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./auth/auth.module";
import { validateEnv } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { UsersModule } from "./users/users.module";
import { CoursesModule } from "./courses/courses.module";
import { LessonsModule } from "./lessons/lessons.module";
import { QuestionsModule } from "./questions/questions.module";
import { AnswersModule } from "./answers/answers.module";
import { GamificationModule } from "./gamification/gamification.module";
import { AIModule } from "./ai/ai.module";
import { GroupsModule } from "./groups/groups.module";
import { UploadsModule } from "./uploads/uploads.module";
import { VocabularyModule } from "./vocabulary/vocabulary.module";
import { ContentModule } from "./content/content.module";
import { PlacementModule } from "./placement/placement.module";
import { TopicsModule } from "./topics/topics.module";
import { LearningPathModule } from "./learning-path/learning-path.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { ExamsModule } from "./exams/exams.module";
import { HealthModule } from "./health/health.module";
import { LoggerModule } from "nestjs-pino";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),

    // === Pino logger ===
    LoggerModule.forRoot({
      pinoHttp: {
        // В dev — красивые цветные логи в консоли
        // В prod — JSON логи (для агрегаторов типа Datadog, Logtail)
        transport:
          process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: "SYS:HH:MM:ss",
                  ignore: "pid,hostname,req.id,res.headers,req.headers",
                },
              }
            : undefined,
        // В prod выводим JSON напрямую — это формат для Logtail/Datadog/etc

        // Уровень логирования
        level: process.env.NODE_ENV === "production" ? "info" : "debug",

        // Авто-генерация request ID (есть в каждом логе одного запроса)
        genReqId: (req) =>
          req.headers["x-request-id"] ??
          `req-${Math.random().toString(36).slice(2)}`,

        // Не логируем body запросов с чувствительными данными
        redact: {
          paths: [
            "req.headers.authorization",
            "req.headers.cookie",
            "req.body.password",
            "req.body.passwordHash",
          ],
          censor: "[REDACTED]",
        },

        // Сериализаторы — что и как показывать в логе
        serializers: {
          req: (req: { id: string; method: string; url: string }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res: { statusCode: number }) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),

    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    // Cron/интервалы: SRS-напоминания, снимки аналитики
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    LessonsModule,
    QuestionsModule,
    AnswersModule,
    GamificationModule,
    AIModule,
    GroupsModule,
    UploadsModule,
    VocabularyModule,
    ContentModule,
    PlacementModule,
    TopicsModule,
    LearningPathModule,
    AnalyticsModule,
    ExamsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
