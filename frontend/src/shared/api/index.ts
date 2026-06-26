export { apiClient, extractApiError } from './client'
export type { ApiError } from './client'

export { authApi } from './endpoints/auth'
export type { LoginPayload, RegisterPayload, RefreshResponse } from './endpoints/auth'

export { usersApi } from './endpoints/users'
export type { UpdateUserPayload, ChangePasswordPayload } from './endpoints/users'

export { onboardingApi } from './endpoints/onboarding'
export type { OnboardingPayload } from './endpoints/onboarding'

export { coursesApi } from './endpoints/courses'
export type {
  CourseSummary,
  CourseDetail,
  CourseFilter,
  CourseCategory,
  CourseStatus,
  PaginatedCourses,
  CreateCoursePayload,
  UpdateCoursePayload,
  CreateGeneratedCoursePayload,
  GeneratedLessonInput,
  GeneratedQuestionInput,
} from './endpoints/courses'

export { lessonsApi } from './endpoints/lessons'
export type {
  LessonStatus,
  LessonSkill,
  LessonSummary,
  LessonDetail,
  CompleteLessonResponse,
  CreateLessonPayload,
  UpdateLessonPayload,
} from './endpoints/lessons'

export { questionsApi } from './endpoints/questions'
export type {
  TeacherQuestion,
  CreateQuestionPayload,
  UpdateQuestionPayload,
} from './endpoints/questions'

export { answersApi } from './endpoints/answers'
export type { SubmitAnswerPayload, MyAnswer, ParsedAiFeedback } from './endpoints/answers'

export { progressApi } from './endpoints/progress'
export type { CourseProgress, LessonProgress, RecentActivityItem } from './endpoints/progress'

export { gamificationApi } from './endpoints/gamification'
export type {
  LevelInfo,
  GamificationInfo,
  AchievementWithStatus,
  LeaderboardEntry,
  LeaderboardResponse,
  LeaderboardPeriod,
} from './endpoints/gamification'

export { aiApi } from './endpoints/ai'
export type {
  MessageRole,
  ChatMessage,
  ConversationSummary,
  ConversationDetail,
  SendMessageResponse,
  CreateConversationPayload,
  ExplainPayload,
  LiveFeedback,
} from './endpoints/ai'

export { uploadsApi } from './endpoints/uploads'
export type {
  UploadPurpose,
  RequestUploadPayload,
  PresignedUploadResponse,
} from './endpoints/uploads'

export { contentApi } from './endpoints/content'
export type {
  ContentSkill,
  GeneratedQuestion,
  GenerateQuestionsPayload,
  GenerateQuestionsResponse,
  GenerateReadingPayload,
  GenerateReadingResponse,
  GenerateListeningPayload,
  GenerateListeningResponse,
  GenerateCoursePayload,
  GeneratedCoursePreview,
  GeneratedLessonPreview,
  GenerateLessonPayload,
} from './endpoints/content'

export { analyticsApi } from './endpoints/analytics'
export type {
  SnapshotLabel,
  SkillBreakdown,
  WeeklyActivityPoint,
  SnapshotView,
  SnapshotSide,
  StudentAnalytics,
  GroupStudentRow,
  GroupAnalyticsView,
} from './endpoints/analytics'

export { learningPathApi, isLearningPath } from './endpoints/learning-path'
export type {
  PathNodeType,
  PathNodeStatus,
  PathNode,
  PathNodeLesson,
  LearningPath,
  LearningPathResponse,
} from './endpoints/learning-path'

export { topicsApi } from './endpoints/topics'
export type {
  TopicSkill,
  TopicSummary,
  TopicLesson,
  TopicDetail,
  CreateTopicPayload,
  UpdateTopicPayload,
} from './endpoints/topics'

export { placementApi } from './endpoints/placement'
export type {
  PlacementQuestion,
  PlacementProgress,
  PlacementStartResponse,
  PlacementAnswerResponse,
  PlacementResult,
} from './endpoints/placement'

export { vocabularyApi } from './endpoints/vocabulary'
export type {
  VocabularyEntry,
  CreateVocabularyPayload,
  UpdateVocabularyPayload,
  VocabularyListResponse,
  VocabularyStats,
  ReviewQuality,
} from './endpoints/vocabulary'

export { examsApi } from './endpoints/exams'
export type {
  ExamType,
  ExamSummary,
  ExamQuestionView,
  ExamStartResponse,
  ExamSubmitResponse,
  ExamResults,
  ExamDetail,
  ExamDetailQuestion,
} from './endpoints/exams'

export { groupsApi } from './endpoints/groups'
export type {
  GroupRole,
  GroupSummary,
  GroupMember,
  GroupDetail,
  GroupAnalytics,
  StudentDetail,
  AllStudentRow,
  MemberStats,
  CreateGroupPayload,
  UpdateGroupPayload,
  MyGroupsResponse,
} from './endpoints/groups'
