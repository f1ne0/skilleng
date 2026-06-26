// Типы словаря живут в shared/api (контракты эндпоинтов) — здесь реэкспорт
export type {
  VocabularyEntry,
  CreateVocabularyPayload,
  UpdateVocabularyPayload,
  VocabularyStats,
  ReviewQuality,
} from '@shared/api'
