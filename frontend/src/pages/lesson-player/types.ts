export type LessonStepKind =
  | 'theory'
  | 'multiple-choice'
  | 'fill-blank'
  | 'drag-drop'
  | 'match-pairs'
  | 'short-writing'
  | 'speaking'

export interface TheoryStep {
  id: string
  kind: 'theory'
  title: string
  body: string
}

export interface QuestionStepBase {
  /** Question ID — used as the key in answer submissions. */
  id: string
  prompt: string
  /** Reward shown in UI; from question.points. */
  points: number
}

export interface MultipleChoiceStep extends QuestionStepBase {
  kind: 'multiple-choice'
  options: string[]
}

export interface FillBlankStep extends QuestionStepBase {
  kind: 'fill-blank'
  /** Sentence with `___` where the blank should be. */
  text: string
  caseSensitive: boolean
}

export interface DragDropStep extends QuestionStepBase {
  kind: 'drag-drop'
  /** Words pre-shuffled by the backend. */
  words: string[]
}

export interface MatchPairsStep extends QuestionStepBase {
  kind: 'match-pairs'
  lefts: string[]
  rights: string[]
}

export interface ShortWritingStep extends QuestionStepBase {
  kind: 'short-writing'
  minWords: number
  maxWords: number
  rubric?: string
}

export interface SpeakingStep extends QuestionStepBase {
  kind: 'speaking'
  expectedKeyPoints?: string[]
  minSeconds?: number
  maxSeconds?: number
}

export type LessonStep =
  | TheoryStep
  | MultipleChoiceStep
  | FillBlankStep
  | DragDropStep
  | MatchPairsStep
  | ShortWritingStep
  | SpeakingStep

export type StepStatus = 'pending' | 'checking' | 'correct' | 'wrong'

/** Per-step answer captured locally before submission. Type depends on step kind. */
export type LocalAnswer =
  | { kind: 'multiple-choice'; selectedIndex: number }
  | { kind: 'fill-blank'; text: string }
  | { kind: 'drag-drop'; ordered: string[] }
  | { kind: 'match-pairs'; mapping: Record<number, number> } // leftIndex -> rightIndex
  | { kind: 'short-writing'; text: string }
  | { kind: 'speaking'; audioUrl: string }

/** Snapshot of server feedback for a step after submission. */
export interface StepFeedback {
  isCorrect: boolean
  explanation: string | null
  /** Server-revealed correct answer payload when wrong. */
  correctAnswer: Record<string, unknown> | null
  /** True when the answer was sent for AI review (speaking/writing) — no instant verdict. */
  aiPending?: boolean
}
