import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  validateSync,
} from "class-validator";

enum Env {
  Development = "development",
  Production = "production",
  Test = "test",
}

class EnvVars {
  @IsEnum(Env)
  NODE_ENV: Env;

  @IsInt()
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET: string;

  @IsString()
  JWT_ACCESS_EXPIRES_IN: string;

  @IsString()
  CORS_ORIGIN: string;

  @IsString()
  @MinLength(10)
  GEMINI_API_KEY: string;

  @IsString()
  @IsOptional()
  GEMINI_MODEL?: string = "gemini-3.5-flash";

  // Алиас: 3.5-flash покрывает и "дешёвые" сценарии (объяснения),
  // отдельная lite-модель больше не нужна
  @IsString()
  @IsOptional()
  GEMINI_MODEL_LITE?: string = "gemini-3.5-flash";

  // TTS: text→speech, 30 голосов, мультиспикер до 2, аудио-теги [...]
  @IsString()
  @IsOptional()
  GEMINI_TTS_MODEL?: string = "gemini-3.1-flash-tts-preview";

  @IsInt()
  @IsOptional()
  AI_DAILY_MESSAGE_LIMIT?: number = 50;

  // ── Хранилище файлов ──────────────────────────────────────────
  // R2 — необязательно: без него используется локальный диск (offline).
  // STORAGE_DRIVER=r2|local — явный выбор.
  @IsString()
  @IsOptional()
  STORAGE_DRIVER?: string;

  @IsString()
  @IsOptional()
  BACKEND_PUBLIC_URL?: string;

  @IsString()
  @IsOptional()
  LOCAL_STORAGE_DIR?: string;

  @IsString()
  @IsOptional()
  R2_ACCOUNT_ID?: string;

  @IsString()
  @IsOptional()
  R2_BUCKET_NAME?: string;

  @IsString()
  @IsOptional()
  R2_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  R2_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  R2_PUBLIC_URL?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvVars, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(", "))
      .join("\n  - ");
    throw new Error(`Invalid environment variables:\n  - ${messages}`);
  }

  return validated;
}
