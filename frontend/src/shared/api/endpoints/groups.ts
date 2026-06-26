import { apiClient } from '../client'

export type GroupRole = 'OWNER' | 'MEMBER'

export interface GroupSummary {
  id: string
  ownerId: string
  name: string
  description: string | null
  inviteCode?: string
  createdAt: string
  updatedAt: string
  role: GroupRole
  joinedAt?: string
  _count?: { memberships: number }
}

export interface GroupMember {
  id: string
  firstName: string
  lastName: string | null
  avatarUrl: string | null
  level: string | null
  totalXp: number
  currentStreak: number
  lastActiveDate: string | null
  joinedAt: string
}

export interface MemberStats {
  answered: number
  accuracyPercent: number
  completedLessons: number
  needsAttention: boolean
}

export interface GroupDetail {
  id: string
  ownerId: string
  name: string
  description: string | null
  inviteCode?: string
  isOwner: boolean
  owner: {
    id: string
    firstName: string
    lastName: string | null
    avatarUrl: string | null
  }
  memberships: Array<{
    joinedAt: string
    user: Omit<GroupMember, 'joinedAt'>
    stats: MemberStats
  }>
  createdAt: string
  updatedAt: string
}

export interface GroupAnalytics {
  totalMembers: number
  avgXp: number
  avgStreak: number
  avgAccuracy: number
  avgLessons: number
  needsAttention: number
  topByXp: Array<{
    userId: string
    firstName: string
    lastName: string | null
    avatarUrl: string | null
    totalXp: number
    currentStreak: number
  }>
  topByAccuracy: Array<{
    userId: string
    firstName: string
    lastName: string | null
    avatarUrl: string | null
    accuracyPercent: number
    answered: number
  }>
  weeklyActivity: Array<{ day: string; submissions: number }>
}

export interface StudentDetail {
  id: string
  firstName: string
  lastName: string | null
  avatarUrl: string | null
  level: string | null
  goal: string | null
  nativeLanguage: string | null
  interests: string[]
  totalXp: number
  currentStreak: number
  longestStreak: number
  lastActiveDate: string | null
  createdAt: string
  completedLessons: number
  accuracyPercent: number
  courses: Array<{
    courseId: string
    courseTitle: string
    completionPercent: number
    lastActivity: string | null
  }>
}

export interface AllStudentRow {
  user: {
    id: string
    firstName: string
    lastName: string | null
    avatarUrl: string | null
    level: string | null
    lastActiveDate: string | null
  }
  groups: Array<{ id: string; name: string }>
  stats: MemberStats
}

export interface CreateGroupPayload {
  name: string
  description?: string
}

export interface UpdateGroupPayload {
  name?: string
  description?: string
}

export interface MyGroupsResponse {
  owned: GroupSummary[]
  member: GroupSummary[]
}

export const groupsApi = {
  my: async (): Promise<MyGroupsResponse> => {
    const { data } = await apiClient.get<MyGroupsResponse>('/groups/my')
    return data
  },
  byId: async (id: string): Promise<GroupDetail> => {
    const { data } = await apiClient.get<GroupDetail>(`/groups/${id}`)
    return data
  },
  create: async (payload: CreateGroupPayload): Promise<GroupSummary> => {
    const { data } = await apiClient.post<GroupSummary>('/groups', payload)
    return data
  },
  update: async (id: string, payload: UpdateGroupPayload): Promise<GroupSummary> => {
    const { data } = await apiClient.patch<GroupSummary>(`/groups/${id}`, payload)
    return data
  },
  delete: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/groups/${id}`)
    return data
  },
  join: async (inviteCode: string) => {
    const { data } = await apiClient.post('/groups/join', { inviteCode })
    return data as { group: { id: string; name: string; description: string | null } }
  },
  leave: async (id: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(`/groups/${id}/leave`)
    return data
  },
  regenerateCode: async (id: string): Promise<{ id: string; inviteCode: string }> => {
    const { data } = await apiClient.post<{ id: string; inviteCode: string }>(
      `/groups/${id}/regenerate-code`,
    )
    return data
  },
  addMember: async (
    groupId: string,
    payload: { email?: string; userId?: string },
  ): Promise<{ success: boolean; userId: string }> => {
    const { data } = await apiClient.post<{ success: boolean; userId: string }>(
      `/groups/${groupId}/members`,
      payload,
    )
    return data
  },
  removeMember: async (groupId: string, userId: string): Promise<{ success: boolean }> => {
    const { data } = await apiClient.delete<{ success: boolean }>(
      `/groups/${groupId}/members/${userId}`,
    )
    return data
  },
  allStudents: async (): Promise<AllStudentRow[]> => {
    const { data } = await apiClient.get<AllStudentRow[]>('/groups/students')
    return data
  },
  analytics: async (id: string): Promise<GroupAnalytics> => {
    const { data } = await apiClient.get<GroupAnalytics>(`/groups/${id}/analytics`)
    return data
  },
  studentDetail: async (groupId: string, userId: string): Promise<StudentDetail> => {
    const { data } = await apiClient.get<StudentDetail>(
      `/groups/${groupId}/members/${userId}/detail`,
    )
    return data
  },
}
