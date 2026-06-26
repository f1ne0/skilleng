import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino";

import cookieParser from "cookie-parser";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    // буферим логи до подмены логгера — иначе старт-логи будут в дефолтном формате
  });

  // Подменяем встроенный NestJS-логгер на Pino
  app.useLogger(app.get(Logger));

  // ВАЖНО: graceful shutdown
  app.enableShutdownHooks();
  // По SIGTERM/SIGINT NestJS вызовет onModuleDestroy на всех провайдерах.
  // PrismaService закроет соединения, активные запросы доедут до конца.

  const config = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());

  const corsOrigin = config.get<string>("CORS_ORIGIN");
  app.enableCors({
    origin: corsOrigin?.split(",") ?? true,
    credentials: true,
  });

  app.setGlobalPrefix("api");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger — только не в production, или с базовой авторизацией
  if (config.get<string>("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("SkillEng API")
      .setDescription("API for English learning platform")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = config.get<number>("PORT") ?? 3000;
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`SkillEng API started on port ${port} (prefix /api)`);
}

void bootstrap();
