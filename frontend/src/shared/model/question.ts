// Доменные типы вопросов (контракты API).
// Живут в shared, чтобы shared/api/endpoints не импортировал из entities —
// entities/question реэкспортирует их для удобства.
export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'FILL_BLANK'
  | 'DRAG_DROP'
  | 'MATCH_PAIRS'
  | 'SHORT_WRITING'
  | 'SPEAKING_RESPONSE'

/** Виды речевой деятельности (навыковые хабы) */
export type SkillType = 'READING' | 'LISTENING' | 'SPEAKING' | 'WRITING'

export interface MultipleChoiceStudentPayload {
  options: string[]
}

export interface FillBlankStudentPayload {
  text: string
  caseSensitive: boolean
}

export interface DragDropStudentPayload {
  words: string[]
}

export interface MatchPairsStudentPayload {
  lefts: string[]
  rights: string[]
}

export interface ShortWritingStudentPayload {
  minWords: number
  maxWords: number
  rubric?: string
}

export interface SpeakingStudentPayload {
  expectedKeyPoints?: string[]
  minSeconds?: number
  maxSeconds?: number
}

export type QuestionStudentPayload =
  | MultipleChoiceStudentPayload
  | FillBlankStudentPayload
  | DragDropStudentPayload
  | MatchPairsStudentPayload
  | ShortWritingStudentPayload
  | SpeakingStudentPayload

export interface QuestionStudentView {
  id: string
  type: QuestionType
  prompt: string
  payload: QuestionStudentPayload
  order: number
  points: number
}

export interface SubmitAnswerResponse {
  /** null = ещё не оценено (SHORT_WRITING — ответ ушёл на AI-проверку) */
  isCorrect: boolean | null
  /** true = ответ отправлен на асинхронную AI-оценку, вердикта пока нет */
  pending: boolean
  isFirstCorrectAttempt: boolean
  pointsEarned: number
  explanation: string | null
  correctAnswer: Record<string, unknown> | null
}
