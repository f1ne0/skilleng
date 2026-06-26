export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: number
  /** Local-only flag for an optimistic pending assistant reply. */
  streaming?: boolean
  /** Local-only reaction state. Not persisted to backend. */
  liked?: boolean
  disliked?: boolean
}

export interface Conversation {
  id: string
  title: string
  createdAt: number
  updatedAt: number
  messages: ChatMessage[]
}
