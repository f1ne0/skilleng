export enum UploadPurpose {
  USER_AVATAR = "USER_AVATAR",
  COURSE_COVER = "COURSE_COVER",
  LESSON_VIDEO = "LESSON_VIDEO",
  LESSON_AUDIO = "LESSON_AUDIO",
  SPEAKING_RESPONSE = "SPEAKING_RESPONSE",
  TTS_CACHE = "TTS_CACHE",
}

export interface PurposeConfig {
  maxBytes: number;
  allowedMimeTypes: readonly string[];
  pathPrefix: string;
  // папка в R2: "avatars/", "covers/", etc.
  systemOnly?: boolean;
  // true = загружает только бэкенд (putObject), presigned-URL юзеру не выдаём
}

export const UPLOAD_CONFIGS: Record<UploadPurpose, PurposeConfig> = {
  [UploadPurpose.USER_AVATAR]: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    pathPrefix: "avatars",
  },
  [UploadPurpose.COURSE_COVER]: {
    maxBytes: 10 * 1024 * 1024, // 10 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    pathPrefix: "covers",
  },
  [UploadPurpose.LESSON_VIDEO]: {
    maxBytes: 500 * 1024 * 1024, // 500 MB
    allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    pathPrefix: "videos",
  },
  [UploadPurpose.LESSON_AUDIO]: {
    maxBytes: 50 * 1024 * 1024, // 50 MB
    allowedMimeTypes: [
      "audio/mpeg",
      "audio/mp4",
      "audio/wav",
      "audio/ogg",
      "audio/webm",
    ],
    pathPrefix: "audio",
  },
  [UploadPurpose.SPEAKING_RESPONSE]: {
    // Записи устных ответов студентов (SPEAKING_RESPONSE-вопросы).
    // MediaRecorder в браузерах отдаёт webm/ogg/mp4 в зависимости от платформы
    maxBytes: 20 * 1024 * 1024, // 20 MB (~3-5 минут записи)
    allowedMimeTypes: [
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
    ],
    pathPrefix: "speaking",
  },
  [UploadPurpose.TTS_CACHE]: {
    // Системная озвучка (Listening-контент). Ключ детерминированный —
    // hash(текст + голос), поэтому повторная генерация того же текста
    // не дёргает Gemini TTS. Заливает только бэкенд.
    maxBytes: 50 * 1024 * 1024,
    allowedMimeTypes: ["audio/wav", "audio/mpeg"],
    pathPrefix: "tts-cache",
    systemOnly: true,
  },
};

// Маппинг MIME → расширение файла
export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "audio/webm": "weba",
};
