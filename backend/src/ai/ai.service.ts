import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { getCorrectAnswerView } from "../answers/answer.utils";
import { ExplainAnswerDto } from "./dto/explain-answer.dto";
import { GeminiClient } from "./gemini.client";
import { EXPLAIN_ANSWER_SYSTEM_PROMPT } from "./prompts/system-prompts";
import {
  WRITING_EVAL_SYSTEM_PROMPT,
  writingEvalPrompt,
} from "./prompts/writing-eval.prompt";
import {
  SPEAKING_EVAL_SYSTEM_PROMPT,
  speakingEvalPrompt,
} from "./prompts/speaking-eval.prompt";

export interface WritingEvaluation {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface SpeakingEvaluation extends WritingEvaluation {
  transcript: string;
}

// Маппинг расширения файла записи → MIME для Gemini
const AUDIO_EXT_TO_MIME: Record<string, string> = {
  weba: "audio/webm",
  webm: "audio/webm",
  ogg: "audio/ogg",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

/**
 * Определяем аудиоформат по «магическим байтам» содержимого, а не по URL.
 * Локальное хранилище отдаёт URL без расширения (/uploads/local/<base64>),
 * поэтому полагаться на расширение нельзя — иначе WAV уходит как audio/webm
 * и Gemini не может его декодировать (отсюда «галлюцинации» на музыке/шуме).
 */
function sniffAudioMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  const ascii = (start: number, len: number) =>
    buf.toString("latin1", start, start + len);
  // WAV: "RIFF"...."WAVE"
  if (ascii(0, 4) === "RIFF" && ascii(8, 4) === "WAVE") return "audio/wav";
  // WebM / Matroska: EBML header 1A 45 DF A3
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3)
    return "audio/webm";
  // OGG: "OggS"
  if (ascii(0, 4) === "OggS") return "audio/ogg";
  // MP4 / M4A: ....ftyp
  if (ascii(4, 4) === "ftyp") return "audio/mp4";
  // MP3: "ID3" tag or MPEG frame sync 0xFFEx/0xFFFx
  if (ascii(0, 3) === "ID3") return "audio/mpeg";
  if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return "audio/mpeg";
  return null;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gemini: GeminiClient,
  ) {}

  // ========== EXPLAIN WRONG ANSWER ==========
  async explainAnswer(userId: string, dto: ExplainAnswerDto): Promise<string> {
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
    });
    if (!question) throw new NotFoundException("Question not found");

    // Контекст для AI: что спросили, что ответил, как было правильно
    const correctAnswerView = getCorrectAnswerView(
      question.type,
      question.payload,
    );

    const userMessage = `Question: ${question.prompt}

Question type: ${question.type}

Student's answer: ${JSON.stringify(dto.studentAnswer)}

Correct answer: ${JSON.stringify(correctAnswerView)}

Explain why the student's answer is wrong and what the correct answer is.`;

    const result = await this.gemini.generate(
      [{ role: "USER" as const, content: userMessage }],
      {
        systemPrompt: EXPLAIN_ANSWER_SYSTEM_PROMPT,
        temperature: 0.5,
        // ниже температура — более точные, менее "креативные" объяснения
        maxOutputTokens: 300,
        useLiteModel: true,
        // дешёвая модель — задача простая
      },
    );

    return result.text;
  }

  // ========== EVALUATE SHORT_WRITING ==========
  async evaluateWriting(params: {
    questionPrompt: string;
    studentText: string;
    minWords: number;
    maxWords: number;
    rubric?: string;
  }): Promise<WritingEvaluation> {
    const userMessage = writingEvalPrompt(
      params.questionPrompt,
      params.studentText,
      params.minWords,
      params.maxWords,
      params.rubric,
    );

    const result = await this.gemini.generate(
      [{ role: "USER" as const, content: userMessage }],
      {
        systemPrompt: WRITING_EVAL_SYSTEM_PROMPT,
        temperature: 0.3,
        // низкая температура для консистентных оценок
        maxOutputTokens: 800,
      },
    );

    // Парсим JSON-ответ от AI
    try {
      // AI иногда оборачивает JSON в ```json блоки — чистим
      const cleaned = result.text
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();

      const parsed = JSON.parse(cleaned) as WritingEvaluation;

      // Валидируем что AI вернул нужные поля
      if (
        typeof parsed.score !== "number" ||
        typeof parsed.feedback !== "string" ||
        !Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.improvements)
      ) {
        throw new Error("Invalid AI response format");
      }

      // Зажимаем score в 0-100
      parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));

      return parsed;
    } catch (err) {
      this.logger.error("Failed to parse AI writing evaluation", err);
      throw new BadRequestException(
        "AI evaluation failed. Please try again later.",
      );
    }
  }

  // ========== LIVE FEEDBACK (черновик письма) ==========
  /**
   * Формирующее оценивание: debounced-подсказки по черновику ПО МЕРЕ набора.
   * Ничего не сохраняет — финальную оценку даёт evaluateWriting после сабмита.
   */
  async liveWritingFeedback(dto: { questionId: string; draft: string }) {
    const question = await this.prisma.question.findUnique({
      where: { id: dto.questionId },
      select: { type: true, prompt: true, payload: true },
    });
    if (!question) throw new NotFoundException("Question not found");
    if (question.type !== "SHORT_WRITING") {
      throw new BadRequestException(
        "Live feedback is available only for SHORT_WRITING questions",
      );
    }

    const payload = question.payload as {
      minWords?: number;
      maxWords?: number;
      rubric?: string;
    };

    const userMessage = `Writing task: "${question.prompt}"
${payload.rubric ? `Rubric: ${payload.rubric}\n` : ""}Expected length: ${payload.minWords ?? "?"}-${payload.maxWords ?? "?"} words.

Student's CURRENT DRAFT (work in progress, may be unfinished):
"""
${dto.draft}
"""

Return JSON: {"predictedScore": <0-100, what the draft would score now>, "hints": ["<up to 3 short, actionable suggestions>"]}
Do NOT rewrite the text for the student. Hints must be encouraging and specific.`;

    const result = await this.gemini.generate(
      [{ role: "USER" as const, content: userMessage }],
      {
        systemPrompt:
          "You are a supportive ESL writing coach giving quick formative feedback on drafts. Respond with strict JSON only.",
        temperature: 0.3,
        maxOutputTokens: 350,
        useLiteModel: true,
        // дешёвый вызов: дергается часто (debounce на фронте)
        jsonOutput: true,
      },
    );

    try {
      const cleaned = result.text
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      const parsed = JSON.parse(cleaned) as {
        predictedScore?: number;
        hints?: string[];
      };
      return {
        predictedScore: Math.max(
          0,
          Math.min(100, Math.round(Number(parsed.predictedScore) || 0)),
        ),
        hints: Array.isArray(parsed.hints)
          ? parsed.hints.slice(0, 3).map(String)
          : [],
      };
    } catch (err) {
      this.logger.error("Failed to parse live feedback", err);
      throw new BadRequestException("AI feedback failed. Keep writing.");
    }
  }

  // ========== EVALUATE SPEAKING_RESPONSE ==========
  /**
   * Качественная оценка устного ответа: транскрипция + содержание/грамматика/
   * беглость/релевантность ключевым точкам. НЕ пофонемная фонетика
   * (см. комментарий в speaking-eval.prompt.ts).
   */
  async evaluateSpeaking(params: {
    audioUrl: string;
    questionPrompt: string;
    expectedKeyPoints?: string[];
    minSeconds?: number;
    maxSeconds?: number;
  }): Promise<SpeakingEvaluation> {
    // Скачиваем запись из R2 (валидация принадлежности URL — на вызывающей стороне)
    const response = await fetch(params.audioUrl);
    if (!response.ok) {
      throw new BadRequestException(
        `Failed to fetch audio recording (${response.status})`,
      );
    }
    const audio = Buffer.from(await response.arrayBuffer());

    // Формат определяем по содержимому (URL локального хранилища без расширения).
    const ext =
      params.audioUrl.split(/[?#]/)[0].split(".").pop()?.toLowerCase() ?? "";
    const mimeType =
      sniffAudioMime(audio) ?? AUDIO_EXT_TO_MIME[ext] ?? "audio/webm";

    const result = await this.gemini.generateFromAudio(
      audio,
      mimeType,
      speakingEvalPrompt({
        questionPrompt: params.questionPrompt,
        expectedKeyPoints: params.expectedKeyPoints,
        minSeconds: params.minSeconds,
        maxSeconds: params.maxSeconds,
      }),
      {
        systemPrompt: SPEAKING_EVAL_SYSTEM_PROMPT,
        temperature: 0.3,
        // низкая температура для консистентных оценок
        maxOutputTokens: 1500,
      },
    );

    try {
      const cleaned = result.text
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();

      const parsed = JSON.parse(cleaned) as SpeakingEvaluation;

      if (
        typeof parsed.score !== "number" ||
        typeof parsed.feedback !== "string" ||
        typeof parsed.transcript !== "string" ||
        !Array.isArray(parsed.strengths) ||
        !Array.isArray(parsed.improvements)
      ) {
        throw new Error("Invalid AI response format");
      }

      parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
      return parsed;
    } catch (err) {
      this.logger.error("Failed to parse AI speaking evaluation", err);
      throw new BadRequestException(
        "AI evaluation failed. Please try again later.",
      );
    }
  }
}
