import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI, Modality } from "@google/genai";

import { MessageRole } from "@prisma/client";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface GenerateOptions {
  systemPrompt?: string;
  temperature?: number;
  maxOutputTokens?: number;
  useLiteModel?: boolean;
  // для дешёвых задач (объяснения) — Flash-Lite модель
  jsonOutput?: boolean;
  // structured output: модель обязана вернуть валидный JSON
}

export interface GenerateResult {
  text: string;
  tokensInput: number;
  tokensOutput: number;
}

export interface SpeechSpeaker {
  /** Имя спикера в тексте диалога ("Anna: ...") */
  speaker: string;
  /** Prebuilt-голос Gemini TTS (Kore, Puck, Charon, ...) */
  voiceName: string;
}

export interface SynthesizeSpeechOptions {
  /** Мультиспикер (до 2) для диалогов. Если задан — voiceName игнорируется */
  speakers?: SpeechSpeaker[];
}

export interface SynthesizedSpeech {
  /** Готовый к проигрыванию файл (WAV-контейнер поверх PCM 24kHz mono) */
  buffer: Buffer;
  mimeType: string; // "audio/wav"
}

// Таймаут на один вызов Gemini. Без него на free-tier запросы
// периодически висят бесконечно и держат соединение.
const REQUEST_TIMEOUT_MS = 20_000;
// Задержка перед единственным повтором на транзиентную ошибку (429/5xx)
const RETRY_DELAY_MS = 750;

// TTS отдаёт сырой PCM: signed 16-bit little-endian, 24kHz, mono
const TTS_SAMPLE_RATE = 24_000;
// TTS-генерация заметно дольше текстовой — отдельный, более щедрый таймаут
const TTS_TIMEOUT_MS = 60_000;

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly client: GoogleGenAI;
  private readonly model: string;
  private readonly modelLite: string;
  private readonly ttsModel: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.getOrThrow<string>("GEMINI_API_KEY");
    this.client = new GoogleGenAI({ apiKey });
    this.model = config.get<string>("GEMINI_MODEL") ?? "gemini-3.5-flash";
    this.modelLite =
      config.get<string>("GEMINI_MODEL_LITE") ?? "gemini-3.5-flash";
    this.ttsModel =
      config.get<string>("GEMINI_TTS_MODEL") ?? "gemini-3.1-flash-tts-preview";
  }

  async generate(
    messages: ChatMessage[],
    options: GenerateOptions = {},
  ): Promise<GenerateResult> {
    const model = options.useLiteModel ? this.modelLite : this.model;

    // Gemini API ждёт role: "user" | "model" (не "assistant")
    const contents = messages.map((m) => ({
      role: m.role === MessageRole.USER ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    try {
      return await this.callModel(model, contents, options);
    } catch (err) {
      // Один повтор — только на транзиентные ошибки (429 и 5xx).
      // Остальные 4xx (невалидный ключ, плохой запрос) ретраить бессмысленно.
      if (!this.isTransientError(err)) {
        this.logger.error("Gemini API error", err);
        throw new Error("AI service unavailable");
      }

      this.logger.warn(
        `Gemini transient error, retrying once in ${RETRY_DELAY_MS}ms`,
        err instanceof Error ? err.message : err,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));

      try {
        return await this.callModel(model, contents, options);
      } catch (retryErr) {
        this.logger.error("Gemini API error after retry", retryErr);
        throw new Error("AI service unavailable");
      }
    }
  }

  // Один вызов модели с жёстким таймаутом.
  // abortSignal отменяет запрос на стороне SDK, Promise.race гарантирует,
  // что мы не зависнем, даже если SDK проигнорирует сигнал.
  private async callModel(
    model: string,
    contents: { role: string; parts: { text: string }[] }[],
    options: GenerateOptions,
  ): Promise<GenerateResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await Promise.race([
        this.client.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction: options.systemPrompt,
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxOutputTokens ?? 2048,
            ...(options.jsonOutput && {
              responseMimeType: "application/json",
            }),
            abortSignal: controller.signal,
          },
        }),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () =>
            reject(
              new Error(`Gemini request timed out after ${REQUEST_TIMEOUT_MS}ms`),
            ),
          );
        }),
      ]);

      const text = response.text ?? "";
      const usage = response.usageMetadata;

      return {
        text,
        tokensInput: usage?.promptTokenCount ?? 0,
        tokensOutput: usage?.candidatesTokenCount ?? 0,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  // ========== TTS: text → speech ==========
  /**
   * Озвучка текста (Listening-контент). Поддерживает аудио-теги Gemini TTS
   * в тексте ([cheerfully], [whispering] и т.п.) и мультиспикер до 2 голосов
   * для диалогов (текст вида "Anna: ...\nTom: ...").
   *
   * Возвращает WAV (PCM 24kHz mono, заголовок собираем сами — без зависимостей).
   * NOTE: при необходимости MP3 — точка апгрейда одна: convertPcmToWav →
   * энкодер (lamejs/ffmpeg). Вызывающий код опирается на mimeType, не на формат.
   */
  async synthesizeSpeech(
    text: string,
    voiceName: string,
    opts: SynthesizeSpeechOptions = {},
  ): Promise<SynthesizedSpeech> {
    const speechConfig = opts.speakers?.length
      ? {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: opts.speakers.slice(0, 2).map((s) => ({
              speaker: s.speaker,
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: s.voiceName },
              },
            })),
          },
        }
      : {
          voiceConfig: { prebuiltVoiceConfig: { voiceName } },
        };

    const call = () =>
      this.withTimeout(
        (signal) =>
          this.client.models.generateContent({
            model: this.ttsModel,
            contents: [{ role: "user", parts: [{ text }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig,
              abortSignal: signal,
            },
          }),
        TTS_TIMEOUT_MS,
        "Gemini TTS",
      );

    try {
      const response = await this.runWithRetry(call);
      const base64 =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64) {
        throw new Error("Gemini TTS returned no audio data");
      }
      const pcm = Buffer.from(base64, "base64");
      return {
        buffer: this.convertPcmToWav(pcm, TTS_SAMPLE_RATE),
        mimeType: "audio/wav",
      };
    } catch (err) {
      this.logger.error("Gemini TTS error", err);
      throw new Error("AI service unavailable");
    }
  }

  // ========== STT/анализ: audio → text ==========
  /**
   * Аудио на вход (запись студента, SPEAKING_RESPONSE) + промпт →
   * текст (транскрипция и/или анализ). Аудио передаётся inline base64 —
   * записи коротких ответов укладываются в лимит inline (~20 МБ запроса).
   */
  async generateFromAudio(
    audio: Buffer,
    mimeType: string,
    prompt: string,
    options: Pick<GenerateOptions, "systemPrompt" | "temperature" | "maxOutputTokens"> = {},
  ): Promise<GenerateResult> {
    const call = () =>
      this.withTimeout(
        (signal) =>
          this.client.models.generateContent({
            model: this.model,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: {
                      mimeType,
                      data: audio.toString("base64"),
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
            config: {
              systemInstruction: options.systemPrompt,
              temperature: options.temperature ?? 0.3,
              maxOutputTokens: options.maxOutputTokens ?? 2048,
              abortSignal: signal,
            },
          }),
        // аудио обрабатывается дольше текста
        TTS_TIMEOUT_MS,
        "Gemini audio analysis",
      );

    try {
      const response = await this.runWithRetry(call);
      const usage = response.usageMetadata;
      return {
        text: response.text ?? "",
        tokensInput: usage?.promptTokenCount ?? 0,
        tokensOutput: usage?.candidatesTokenCount ?? 0,
      };
    } catch (err) {
      this.logger.error("Gemini audio analysis error", err);
      throw new Error("AI service unavailable");
    }
  }

  // ========== SHARED HELPERS ==========

  // Жёсткий таймаут: abortSignal + Promise.race (если SDK проигнорирует сигнал)
  private async withTimeout<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    timeoutMs: number,
    label: string,
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await Promise.race([
        fn(controller.signal),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener("abort", () =>
            reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }

  // Один повтор на транзиентные ошибки (429/5xx) — общий для всех вызовов
  private async runWithRetry<T>(call: () => Promise<T>): Promise<T> {
    try {
      return await call();
    } catch (err) {
      if (!this.isTransientError(err)) throw err;
      this.logger.warn(
        `Gemini transient error, retrying once in ${RETRY_DELAY_MS}ms`,
        err instanceof Error ? err.message : err,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return await call();
    }
  }

  /**
   * Оборачивает сырой PCM (s16le mono) в WAV-контейнер.
   * 44-байтовый заголовок по спецификации RIFF — без внешних зависимостей.
   */
  private convertPcmToWav(pcm: Buffer, sampleRate: number): Buffer {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;

    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16); // размер fmt-чанка
    header.writeUInt16LE(1, 20); // PCM
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcm.length, 40);

    return Buffer.concat([header, pcm]);
  }

  // HTTP 429 (rate limit) и 5xx — транзиентные, их имеет смысл повторить
  private isTransientError(err: unknown): boolean {
    const e = err as {
      status?: number | string;
      code?: number;
      message?: string;
    };
    const status =
      typeof e?.status === "number"
        ? e.status
        : typeof e?.code === "number"
          ? e.code
          : undefined;
    if (status !== undefined) {
      return status === 429 || status >= 500;
    }
    const msg = String(e?.message ?? "");
    return (
      /\b(429|5\d\d)\b/.test(msg) ||
      /RESOURCE_EXHAUSTED|UNAVAILABLE|INTERNAL/i.test(msg)
    );
  }
}
