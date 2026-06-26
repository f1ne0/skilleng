import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Throttle } from "@nestjs/throttler";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ContentService } from "./content.service";
import { GenerateCourseDto } from "./dto/generate-course.dto";
import { GenerateLessonDto } from "./dto/generate-lesson.dto";
import { GenerateListeningDto } from "./dto/generate-listening.dto";
import { GenerateQuestionsDto } from "./dto/generate-questions.dto";
import { GenerateReadingDto } from "./dto/generate-reading.dto";
import { SynthesizeTtsDto } from "./dto/synthesize-tts.dto";

// AI-конструктор дидактических материалов. Только TEACHER.
// ВАЖНО: эндпоинты возвращают ПРЕВЬЮ — ничего не сохраняется в БД.
// Сохранение — явное действие преподавателя через существующий questions API.
@ApiTags("Content generation")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
@Controller("content")
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post("generate-questions")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Сгенерировать вопросы по теме/уровню (превью)" })
  generateQuestions(@Body() dto: GenerateQuestionsDto) {
    return this.contentService.generateQuestions(dto);
  }

  @Post("generate-course")
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @ApiOperation({ summary: "Сгенерировать целый курс: уроки + вопросы (превью)" })
  generateCourse(@Body() dto: GenerateCourseDto) {
    return this.contentService.generateCourse(dto);
  }

  @Post("generate-lesson")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Сгенерировать текст одного урока по теме (превью)" })
  generateLesson(@Body() dto: GenerateLessonDto) {
    return this.contentService.generateLessonText(dto);
  }

  @Post("generate-reading")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: "Сгенерировать reading-текст под уровень + вопросы" })
  generateReading(@Body() dto: GenerateReadingDto) {
    return this.contentService.generateReading(dto);
  }

  @Post("generate-listening")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: "Сгенерировать listening: текст/диалог + озвучка (TTS) + вопросы",
  })
  generateListening(@Body() dto: GenerateListeningDto) {
    return this.contentService.generateListening(dto);
  }
}

// Отдельный путь /api/tts/* — озвучка произвольного текста для уроков.
// Тот же модуль: использует тот же TTS-пайплайн и R2-кэш
@ApiTags("TTS")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.TEACHER)
@Controller("tts")
export class TtsController {
  constructor(private readonly contentService: ContentService) {}

  @Post("synthesize")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: "Озвучить текст (кэшируется), вернуть URL — для Lesson.audioUrl",
  })
  synthesize(@Body() dto: SynthesizeTtsDto) {
    return this.contentService.synthesizeTts(dto);
  }
}
