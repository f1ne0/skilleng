// Типы переехали в shared/model, чтобы shared/api/endpoints
// не импортировал из entities (FSD). Здесь — реэкспорт для потребителей.
export type {
  QuestionType,
  SkillType,
  QuestionStudentView,
  QuestionStudentPayload,
  MultipleChoiceStudentPayload,
  FillBlankStudentPayload,
  DragDropStudentPayload,
  MatchPairsStudentPayload,
  ShortWritingStudentPayload,
  SpeakingStudentPayload,
  SubmitAnswerResponse,
} from '@shared/model'
