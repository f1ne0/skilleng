import type { LessonDetail } from '@shared/api'
import type {
  QuestionStudentView,
  MultipleChoiceStudentPayload,
  FillBlankStudentPayload,
  DragDropStudentPayload,
  MatchPairsStudentPayload,
  ShortWritingStudentPayload,
  SpeakingStudentPayload,
} from '@entities/question'
import type {
  LessonStep,
  TheoryStep,
  LocalAnswer,
} from './types'

export function buildLessonSteps(
  lesson: LessonDetail,
  questions: QuestionStudentView[],
): LessonStep[] {
  const steps: LessonStep[] = []

  if (lesson.content && lesson.content.trim().length > 0) {
    const theory: TheoryStep = {
      id: `theory-${lesson.id}`,
      kind: 'theory',
      title: lesson.title,
      body: lesson.content,
    }
    steps.push(theory)
  }

  for (const q of questions) {
    const step = adaptQuestion(q)
    if (step) steps.push(step)
  }

  return steps
}

function adaptQuestion(q: QuestionStudentView): LessonStep | null {
  switch (q.type) {
    case 'MULTIPLE_CHOICE': {
      const p = q.payload as MultipleChoiceStudentPayload
      return {
        id: q.id,
        kind: 'multiple-choice',
        prompt: q.prompt,
        points: q.points,
        options: p.options,
      }
    }
    case 'FILL_BLANK': {
      const p = q.payload as FillBlankStudentPayload
      return {
        id: q.id,
        kind: 'fill-blank',
        prompt: q.prompt,
        points: q.points,
        text: p.text,
        caseSensitive: p.caseSensitive ?? false,
      }
    }
    case 'DRAG_DROP': {
      const p = q.payload as DragDropStudentPayload
      return {
        id: q.id,
        kind: 'drag-drop',
        prompt: q.prompt,
        points: q.points,
        words: p.words,
      }
    }
    case 'MATCH_PAIRS': {
      const p = q.payload as Partial<MatchPairsStudentPayload> & {
        pairs?: Array<{ left: string; right: string }>
      }
      // Student view: { lefts, rights }. Owner/raw view: { pairs }.
      let lefts = p.lefts ?? []
      let rights = p.rights ?? []
      if ((!p.lefts || !p.rights) && Array.isArray(p.pairs)) {
        lefts = p.pairs.map((pair) => pair.left)
        rights = p.pairs.map((pair) => pair.right)
      }
      return {
        id: q.id,
        kind: 'match-pairs',
        prompt: q.prompt,
        points: q.points,
        lefts,
        rights,
      }
    }
    case 'SHORT_WRITING': {
      const p = q.payload as ShortWritingStudentPayload
      return {
        id: q.id,
        kind: 'short-writing',
        prompt: q.prompt,
        points: q.points,
        minWords: p.minWords,
        maxWords: p.maxWords,
        rubric: p.rubric,
      }
    }
    case 'SPEAKING_RESPONSE': {
      const p = q.payload as SpeakingStudentPayload
      return {
        id: q.id,
        kind: 'speaking',
        prompt: q.prompt,
        points: q.points,
        expectedKeyPoints: p.expectedKeyPoints,
        minSeconds: p.minSeconds,
        maxSeconds: p.maxSeconds,
      }
    }
    default:
      return null
  }
}

/** Convert a LocalAnswer into the server payload shape. */
export function answerToServerPayload(
  answer: LocalAnswer,
  step: LessonStep,
): Record<string, unknown> {
  switch (answer.kind) {
    case 'multiple-choice':
      return { selectedIndex: answer.selectedIndex }
    case 'fill-blank':
      return { answer: answer.text }
    case 'drag-drop':
      return { orderedWords: answer.ordered }
    case 'match-pairs': {
      if (step.kind !== 'match-pairs') return { matches: [] }
      const matches = Object.entries(answer.mapping).map(([leftIdx, rightIdx]) => ({
        left: step.lefts[Number(leftIdx)] ?? '',
        right: step.rights[rightIdx] ?? '',
      }))
      return { matches }
    }
    case 'short-writing':
      return { text: answer.text }
    case 'speaking':
      return { audioUrl: answer.audioUrl }
  }
}

export function isAnswerReady(answer: LocalAnswer | undefined, step: LessonStep): boolean {
  if (!answer) return false
  if (answer.kind !== step.kind) return false
  switch (answer.kind) {
    case 'multiple-choice':
      return answer.selectedIndex >= 0
    case 'fill-blank':
      return answer.text.trim().length > 0
    case 'drag-drop':
      return answer.ordered.length > 0
    case 'match-pairs': {
      if (step.kind !== 'match-pairs') return false
      return Object.keys(answer.mapping).length === step.lefts.length
    }
    case 'short-writing': {
      if (step.kind !== 'short-writing') return false
      const words = answer.text.trim().split(/\s+/).filter(Boolean).length
      return words >= step.minWords && words <= step.maxWords
    }
    case 'speaking':
      // готово, когда запись загружена в R2
      return answer.audioUrl.length > 0
  }
}
