import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { QuestionType } from "@prisma/client";

import { GeminiClient } from "../ai/gemini.client";
import { validatePayloadByType } from "../questions/payload.utils";
import { UploadsService } from "../uploads/uploads.service";
import { GenerateCourseDto } from "./dto/generate-course.dto";
import { GenerateLessonDto } from "./dto/generate-lesson.dto";
import { GenerateListeningDto, ListeningFormat } from "./dto/generate-listening.dto";
import { GenerateQuestionsDto } from "./dto/generate-questions.dto";
import { GenerateReadingDto, ReadingLength } from "./dto/generate-reading.dto";
import {
  CONTENT_GEN_SYSTEM_PROMPT,
  courseOutlinePrompt,
  lessonGenPrompt,
  lessonTextPrompt,
  listeningGenPrompt,
  questionsGenPrompt,
  readingGenPrompt,
} from "./prompts/content-gen.prompts";

// Превью сгенерированного курса. НЕ сохраняется — учитель правит и сохраняет сам.
export interface GeneratedLessonPreview {
  title: string;
  description: string;
  content: string;
  questions: GeneratedQuestion[];
}
export interface GeneratedCoursePreview {
  title: string;
  description: string;
  level: string;
  category: string;
  lessons: GeneratedLessonPreview[];
}

// Сгенерированный вопрос-превью. НЕ сохраняется в БД —
// преподаватель просматривает, редактирует и сохраняет сам (questions API)
export interface GeneratedQuestion {
  type: QuestionType;
  prompt: string;
  explanation: string | null;
  payload: Record<string, unknown>;
}

interface RawQuestion {
  type?: string;
  prompt?: string;
  explanation?: string;
  payload?: unknown;
}

const READING_WORDS: Record<ReadingLength, string> = {
  [ReadingLength.SHORT]: "100-150",
  [ReadingLength.MEDIUM]: "200-300",
  [ReadingLength.LONG]: "400-500",
};

// Голоса по умолчанию для Listening (prebuilt-голоса Gemini TTS)
const VOICE_PRIMARY = "Kore";
const VOICE_SECONDARY = "Puck";
const SPEAKER_A = "Anna";
const SPEAKER_B = "Tom";

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    private readonly gemini: GeminiClient,
    private readonly uploads: UploadsService,
  ) {}

  // ========== QUESTIONS ==========
  async generateQuestions(dto: GenerateQuestionsDto) {
    let valid = await this.generateAndValidate(
      questionsGenPrompt({
        topic: dto.topic,
        level: dto.level,
        skill: dto.skill,
        types: dto.types,
        count: dto.count,
      }),
      dto.types,
    );

    // Невалидные элементы отброшены валидатором. Если недобор —
    // одна дополнительная попытка на дефицит, потом отдаём что есть
    if (valid.length < dto.count) {
      const deficit = dto.count - valid.length;
      this.logger.warn(
        `Generated ${valid.length}/${dto.count} valid questions, regenerating ${deficit}`,
      );
      const extra = await this.generateAndValidate(
        questionsGenPrompt({
          topic: dto.topic,
          level: dto.level,
          skill: dto.skill,
          types: dto.types,
          count: deficit,
        }),
        dto.types,
      );
      valid = [...valid, ...extra].slice(0, dto.count);
    }

    if (valid.length === 0) {
      throw new BadRequestException(
        "AI failed to generate valid questions. Try a different topic or fewer types.",
      );
    }

    return {
      questions: valid.slice(0, dto.count),
      requested: dto.count,
      generated: Math.min(valid.length, dto.count),
    };
  }

  // ========== COURSE (целый курс с нуля) ==========
  async generateCourse(dto: GenerateCourseDto): Promise<GeneratedCoursePreview> {
    // 1. План курса: название, описание, список уроков (заголовок + краткое содержание)
    const outlineRes = await this.gemini.generate(
      [
        {
          role: "USER" as const,
          content: courseOutlinePrompt({
            topic: dto.topic,
            level: dto.level,
            lessonCount: dto.lessonCount,
          }),
        },
      ],
      {
        systemPrompt: CONTENT_GEN_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 2048,
        jsonOutput: true,
      },
    );

    const outline = this.parseJson<{
      title?: string;
      description?: string;
      lessons?: { title?: string; summary?: string }[];
    }>(outlineRes.text);

    const plannedLessons = (outline.lessons ?? [])
      .filter((l) => l.title)
      .slice(0, dto.lessonCount);

    if (!outline.title || plannedLessons.length === 0) {
      throw new BadRequestException(
        "AI failed to plan the course. Try a clearer topic.",
      );
    }

    // 2. Для каждого урока: текст (теория) + практические вопросы.
    //    Генерим последовательно — параллель легко упирается в rate limit free-tier.
    const lessons: GeneratedLessonPreview[] = [];
    for (const planned of plannedLessons) {
      try {
        const res = await this.gemini.generate(
          [
            {
              role: "USER" as const,
              content: lessonGenPrompt({
                courseTopic: dto.topic,
                level: dto.level,
                lessonTitle: planned.title!,
                lessonSummary: planned.summary ?? planned.title!,
                questionCount: 3,
              }),
            },
          ],
          {
            systemPrompt: CONTENT_GEN_SYSTEM_PROMPT,
            temperature: 0.7,
            maxOutputTokens: 4096,
            jsonOutput: true,
          },
        );
        const parsed = this.parseJson<{
          content?: string;
          questions?: RawQuestion[];
        }>(res.text);

        const content = (parsed.content ?? "").trim();
        if (content.length < 10) continue;

        const questions = await this.validateQuestions(parsed.questions ?? [], [
          QuestionType.MULTIPLE_CHOICE,
          QuestionType.FILL_BLANK,
        ]);

        lessons.push({
          title: planned.title!.trim(),
          description: (planned.summary ?? "").trim(),
          content,
          questions,
        });
      } catch (err) {
        this.logger.warn(
          `Course lesson gen failed for "${planned.title}": ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    if (lessons.length === 0) {
      throw new BadRequestException(
        "AI failed to write lesson content. Try again or a different topic.",
      );
    }

    return {
      title: outline.title.trim(),
      description: (outline.description ?? "").trim(),
      level: dto.level,
      category: dto.category ?? "GRAMMAR",
      lessons,
    };
  }

  // ========== LESSON TEXT (теория одного урока) ==========
  async generateLessonText(dto: GenerateLessonDto): Promise<{ content: string }> {
    const res = await this.gemini.generate(
      [
        {
          role: "USER" as const,
          content: lessonTextPrompt({ topic: dto.topic, level: dto.level }),
        },
      ],
      {
        systemPrompt: CONTENT_GEN_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 2048,
        jsonOutput: true,
      },
    );
    const parsed = this.parseJson<{ content?: string }>(res.text);
    const content = (parsed.content ?? "").trim();
    if (content.length < 10) {
      throw new BadRequestException(
        "AI failed to write the lesson. Try again or a clearer title.",
      );
    }
    return { content };
  }

  // ========== READING ==========
  async generateReading(dto: GenerateReadingDto) {
    const result = await this.gemini.generate(
      [
        {
          role: "USER" as const,
          content: readingGenPrompt({
            topic: dto.topic,
            level: dto.level,
            words: READING_WORDS[dto.length],
            questionCount: dto.questionCount ?? 4,
          }),
        },
      ],
      {
        systemPrompt: CONTENT_GEN_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 4096,
        jsonOutput: true,
      },
    );

    const parsed = this.parseJson<{
      title?: string;
      text?: string;
      questions?: RawQuestion[];
    }>(result.text);

    if (!parsed.title || !parsed.text) {
      throw new BadRequestException("AI returned malformed reading content");
    }

    const questions = await this.validateQuestions(parsed.questions ?? [], [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.FILL_BLANK,
      QuestionType.MATCH_PAIRS,
    ]);

    return {
      title: parsed.title,
      text: parsed.text,
      level: dto.level,
      questions,
    };
  }

  // ========== LISTENING ==========
  async generateListening(dto: GenerateListeningDto) {
    // 1. Генерим транскрипт + вопросы
    const result = await this.gemini.generate(
      [
        {
          role: "USER" as const,
          content: listeningGenPrompt({
            topic: dto.topic,
            level: dto.level,
            format: dto.format,
            questionCount: dto.questionCount ?? 4,
            speakerA: SPEAKER_A,
            speakerB: SPEAKER_B,
          }),
        },
      ],
      {
        systemPrompt: CONTENT_GEN_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 4096,
        jsonOutput: true,
      },
    );

    const parsed = this.parseJson<{
      title?: string;
      transcript?: string;
      questions?: RawQuestion[];
    }>(result.text);

    if (!parsed.title || !parsed.transcript) {
      throw new BadRequestException("AI returned malformed listening content");
    }

    const questions = await this.validateQuestions(parsed.questions ?? [], [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.FILL_BLANK,
    ]);

    // 2. Озвучка через TTS с кэшем в R2 (один текст+голос = одна генерация)
    const isDialogue = dto.format === ListeningFormat.DIALOGUE;
    const voiceSignature = isDialogue
      ? `multi:${SPEAKER_A}=${VOICE_PRIMARY},${SPEAKER_B}=${VOICE_SECONDARY}`
      : VOICE_PRIMARY;

    const cacheKey = this.uploads.ttsCacheKey(parsed.transcript, voiceSignature);
    let audioUrl = await this.uploads.ttsCacheLookup(cacheKey);

    if (!audioUrl) {
      const speech = await this.gemini.synthesizeSpeech(
        parsed.transcript,
        VOICE_PRIMARY,
        isDialogue
          ? {
              speakers: [
                { speaker: SPEAKER_A, voiceName: VOICE_PRIMARY },
                { speaker: SPEAKER_B, voiceName: VOICE_SECONDARY },
              ],
            }
          : {},
      );
      audioUrl = await this.uploads.ttsCachePut(
        cacheKey,
        speech.buffer,
        speech.mimeType,
      );
    }

    return {
      title: parsed.title,
      transcript: parsed.transcript,
      audioUrl,
      level: dto.level,
      questions,
    };
  }

  // ========== TTS (озвучка произвольного текста, teacher) ==========
  /** Озвучить текст с кэшированием в R2: один текст+голос = одна генерация */
  async synthesizeTts(dto: {
    text: string;
    voice?: string;
    speakers?: { speaker: string; voiceName: string }[];
  }) {
    const voice = dto.voice ?? "Kore";
    const voiceSignature = dto.speakers?.length
      ? `multi:${dto.speakers.map((s) => `${s.speaker}=${s.voiceName}`).join(",")}`
      : voice;

    const cacheKey = this.uploads.ttsCacheKey(dto.text, voiceSignature);
    const cached = await this.uploads.ttsCacheLookup(cacheKey);
    if (cached) {
      return { audioUrl: cached, cached: true };
    }

    const speech = await this.gemini.synthesizeSpeech(dto.text, voice, {
      speakers: dto.speakers,
    });
    const audioUrl = await this.uploads.ttsCachePut(
      cacheKey,
      speech.buffer,
      speech.mimeType,
    );
    return { audioUrl, cached: false };
  }

  // ========== HELPERS ==========

  private async generateAndValidate(
    prompt: string,
    allowedTypes: QuestionType[],
  ): Promise<GeneratedQuestion[]> {
    const result = await this.gemini.generate(
      [{ role: "USER" as const, content: prompt }],
      {
        systemPrompt: CONTENT_GEN_SYSTEM_PROMPT,
        temperature: 0.7,
        maxOutputTokens: 4096,
        jsonOutput: true,
      },
    );

    const parsed = this.parseJson<{ questions?: RawQuestion[] }>(result.text);
    return this.validateQuestions(parsed.questions ?? [], allowedTypes);
  }

  /**
   * Контрактный фильтр: каждый AI-вопрос прогоняется через тот же
   * validatePayloadByType, что и ручное создание вопросов.
   * Невалидные элементы отбрасываются (с логом), а не чинятся молча.
   */
  private async validateQuestions(
    raw: RawQuestion[],
    allowedTypes: QuestionType[],
  ): Promise<GeneratedQuestion[]> {
    const valid: GeneratedQuestion[] = [];

    for (const item of raw) {
      const type = item.type as QuestionType;
      if (!allowedTypes.includes(type)) {
        this.logger.warn(`AI returned disallowed question type: ${item.type}`);
        continue;
      }
      if (!item.prompt || typeof item.prompt !== "string") {
        this.logger.warn("AI returned question without prompt");
        continue;
      }

      try {
        const payload = await validatePayloadByType(type, item.payload);
        valid.push({
          type,
          prompt: item.prompt.trim(),
          explanation:
            typeof item.explanation === "string"
              ? item.explanation.trim()
              : null,
          payload,
        });
      } catch (err) {
        this.logger.warn(
          `Dropping invalid generated ${type} question: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return valid;
  }

  private parseJson<T>(text: string): T {
    try {
      // jsonOutput включён, но на всякий случай чистим возможные ```-обёртки
      const cleaned = text
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.error(`Failed to parse AI JSON: ${text.slice(0, 200)}`);
      throw new BadRequestException("AI returned malformed JSON. Try again.");
    }
  }
}
