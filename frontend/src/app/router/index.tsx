import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PreviewPage } from '@pages/preview'
import { LoginPage } from '@pages/login'
import { RegisterPage } from '@pages/register'
import { OnboardingPage } from '@pages/onboarding'
import { PlacementPage } from '@pages/placement'
import { DashboardPage } from '@pages/dashboard'
import { ProfilePage } from '@pages/profile'
import { CoursesListPage, CourseDetailPage } from '@pages/courses'
import { AITutorPage } from '@pages/ai-tutor'
import { LessonPlayerPage } from '@pages/lesson-player'
import { AchievementsPage } from '@pages/achievements'
import { LeaderboardPage } from '@pages/leaderboard'
import { VocabularyPage } from '@pages/vocabulary'
import { VocabularyReviewPage } from '@pages/vocabulary-review'
import { SkillHubPage } from '@pages/skills'
import { TopicsCatalogPage, TopicDetailPage } from '@pages/topics'
import { LearningPathPage } from '@pages/learning-path'
import { ExamPage } from '@pages/exam'
import { GroupsListPage, GroupDetailPage } from '@pages/groups'
import { NotFoundPage } from '@pages/not-found'
import { ForbiddenPage } from '@pages/forbidden'
import {
  TeachDashboardPage,
  TeachCoursesListPage,
  TeachCourseNewPage,
  TeachCourseGeneratePage,
  TeachCourseEditPage,
  TeachLessonsListPage,
  TeachLessonNewPage,
  TeachLessonEditPage,
  TeachQuestionsListPage,
  TeachQuestionNewPage,
  TeachQuestionEditPage,
  TeachGroupsListPage,
  TeachGroupDetailPage,
  TeachStudentDetailPage,
  TeachStudentsPage,
  TeachTopicsPage,
  TeachAnalyticsPage,
  TeachExamsPage,
} from '@pages/teach'
import { AppShell } from '@widgets/app-shell'
import { CommandPalette } from '@widgets/command-palette'
import { ProtectedRoute, GuestOnlyRoute, RequireRole, RoleZone } from './ProtectedRoute'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/preview', element: <PreviewPage /> },
  { path: '/forbidden', element: <ForbiddenPage /> },
  {
    path: '/login',
    element: (
      <GuestOnlyRoute>
        <LoginPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <GuestOnlyRoute>
        <RegisterPage />
      </GuestOnlyRoute>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute requireOnboarding={false}>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/placement',
    element: (
      <ProtectedRoute requireOnboarding={false}>
        <PlacementPage />
      </ProtectedRoute>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <CommandPalette />
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      // Общие для обеих ролей: AI (тьютор/ассистент) и профиль
      { path: '/ai-tutor',          element: <AITutorPage /> },
      { path: '/profile',           element: <ProfilePage /> },

      // Зона студента — учителя сюда не пускаем (уводим на /teach)
      {
        element: <RoleZone role="STUDENT" />,
        children: [
          { path: '/dashboard',         element: <DashboardPage /> },
          { path: '/path',              element: <LearningPathPage /> },
          { path: '/courses',           element: <CoursesListPage /> },
          { path: '/courses/:slug',     element: <CourseDetailPage /> },
          { path: '/vocabulary',        element: <VocabularyPage /> },
          { path: '/vocabulary/review', element: <VocabularyReviewPage /> },
          { path: '/skills/:skill',     element: <SkillHubPage /> },
          { path: '/topics',            element: <TopicsCatalogPage /> },
          { path: '/topics/:id',        element: <TopicDetailPage /> },
          { path: '/exam/:examId',      element: <ExamPage /> },
          { path: '/achievements',      element: <AchievementsPage /> },
          { path: '/leaderboard',       element: <LeaderboardPage /> },
          { path: '/groups',            element: <GroupsListPage /> },
          { path: '/groups/:id',        element: <GroupDetailPage /> },
        ],
      },

      // Teacher zone
      {
        path: '/teach',
        element: (
          <RequireRole role="TEACHER">
            <TeachDashboardPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses',
        element: (
          <RequireRole role="TEACHER">
            <TeachCoursesListPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses/new',
        element: (
          <RequireRole role="TEACHER">
            <TeachCourseNewPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses/generate',
        element: (
          <RequireRole role="TEACHER">
            <TeachCourseGeneratePage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses/:id/edit',
        element: (
          <RequireRole role="TEACHER">
            <TeachCourseEditPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses/:id/lessons',
        element: (
          <RequireRole role="TEACHER">
            <TeachLessonsListPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses/:id/lessons/new',
        element: (
          <RequireRole role="TEACHER">
            <TeachLessonNewPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses/:id/lessons/:lessonId/edit',
        element: (
          <RequireRole role="TEACHER">
            <TeachLessonEditPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses/:id/lessons/:lessonId/questions',
        element: (
          <RequireRole role="TEACHER">
            <TeachQuestionsListPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses/:id/lessons/:lessonId/questions/new',
        element: (
          <RequireRole role="TEACHER">
            <TeachQuestionNewPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/courses/:id/lessons/:lessonId/questions/:questionId/edit',
        element: (
          <RequireRole role="TEACHER">
            <TeachQuestionEditPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/topics',
        element: (
          <RequireRole role="TEACHER">
            <TeachTopicsPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/analytics',
        element: (
          <RequireRole role="TEACHER">
            <TeachAnalyticsPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/exams',
        element: (
          <RequireRole role="TEACHER">
            <TeachExamsPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/students',
        element: (
          <RequireRole role="TEACHER">
            <TeachStudentsPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/groups',
        element: (
          <RequireRole role="TEACHER">
            <TeachGroupsListPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/groups/:id',
        element: (
          <RequireRole role="TEACHER">
            <TeachGroupDetailPage />
          </RequireRole>
        ),
      },
      {
        path: '/teach/groups/:id/students/:userId',
        element: (
          <RequireRole role="TEACHER">
            <TeachStudentDetailPage />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: '/courses/:slug/lessons/:lessonSlug',
    element: (
      <ProtectedRoute>
        <LessonPlayerPage />
      </ProtectedRoute>
    ),
  },
  { path: '*', element: <NotFoundPage /> },
])
