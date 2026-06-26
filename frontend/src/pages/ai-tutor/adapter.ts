import type {
  ChatMessage as ApiChatMessage,
  ConversationDetail,
  ConversationSummary,
} from '@shared/api'
import type { ChatMessage, Conversation } from './types'

export function adaptMessage(m: ApiChatMessage): ChatMessage {
  return {
    id: m.id,
    role: m.role === 'USER' ? 'user' : 'assistant',
    content: m.content,
    createdAt: new Date(m.createdAt).getTime(),
  }
}

export function adaptConversation(c: ConversationDetail): Conversation {
  return {
    id: c.id,
    title: c.title ?? 'New conversation',
    createdAt: new Date(c.createdAt).getTime(),
    updatedAt: new Date(c.updatedAt).getTime(),
    // POST /ai/conversations отдаёт диалог без messages — без ?? [] select
    // кидал исключение, и React Query показывал "Couldn't load conversation"
    messages: (c.messages ?? []).map(adaptMessage),
  }
}

export function adaptConversationSummary(c: ConversationSummary): Conversation {
  return {
    id: c.id,
    title: c.title ?? 'New conversation',
    createdAt: new Date(c.createdAt).getTime(),
    updatedAt: new Date(c.updatedAt).getTime(),
    messages: [],
  }
}
