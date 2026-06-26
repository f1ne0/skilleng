import { apiClient } from '../client'

export type MessageRole = 'USER' | 'ASSISTANT'

export interface ChatMessage {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  createdAt: string
}

export interface ConversationSummary {
  id: string
  title: string | null
  lessonId: string | null
  createdAt: string
  updatedAt: string
  lastMessageAt: string | null
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[]
}

export interface SendMessageResponse {
  message: ChatMessage
  tokensUsed: number
}

export interface CreateConversationPayload {
  lessonId?: string
}

export interface ExplainPayload {
  questionId: string
  studentAnswer: Record<string, unknown>
}

export const aiApi = {
  createConversation: async (
    payload: CreateConversationPayload = {},
  ): Promise<ConversationDetail> => {
    const { data } = await apiClient.post<ConversationDetail>('/ai/conversations', payload)
    return data
  },
  listConversations: async (): Promise<ConversationSummary[]> => {
    const { data } = await apiClient.get<ConversationSummary[]>('/ai/conversations')
    return data
  },
  getConversation: async (id: string): Promise<ConversationDetail> => {
    const { data } = await apiClient.get<ConversationDetail>(`/ai/conversations/${id}`)
    return data
  },
  sendMessage: async (
    id: string,
    content: string,
    signal?: AbortSignal,
  ): Promise<SendMessageResponse> => {
    const { data } = await apiClient.post<SendMessageResponse>(
      `/ai/conversations/${id}/messages`,
      { content },
      { signal },
    )
    return data
  },
  renameConversation: async (id: string, title: string): Promise<ConversationSummary> => {
    const { data } = await apiClient.patch<ConversationSummary>(
      `/ai/conversations/${id}`,
      { title },
    )
    return data
  },
  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/ai/conversations/${id}`)
  },
  explain: async (payload: ExplainPayload): Promise<{ explanation: string }> => {
    const { data } = await apiClient.post<{ explanation: string }>('/ai/explain', payload)
    return data
  },
  /** Debounced-фидбек по черновику письма. Ничего не сохраняет */
  writingLiveFeedback: async (payload: {
    questionId: string
    draft: string
  }): Promise<LiveFeedback> => {
    const { data } = await apiClient.post<LiveFeedback>(
      '/ai/writing/live-feedback',
      payload,
    )
    return data
  },
}

export interface LiveFeedback {
  predictedScore: number
  hints: string[]
}
