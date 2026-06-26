import { create } from 'zustand'

type Reaction = 'like' | 'dislike' | null

interface ChatUIState {
  activeId: string | null
  draft: string
  /** Local-only message reactions (not persisted). */
  reactions: Record<string, Reaction>
  selectConversation: (id: string | null) => void
  setDraft: (v: string) => void
  setReaction: (messageId: string, value: Reaction) => void
  clearReactions: () => void
}

export const useChatStore = create<ChatUIState>((set) => ({
  activeId: null,
  draft: '',
  reactions: {},
  selectConversation: (id) => set({ activeId: id }),
  setDraft: (v) => set({ draft: v }),
  setReaction: (messageId, value) =>
    set((s) => ({ reactions: { ...s.reactions, [messageId]: value } })),
  clearReactions: () => set({ reactions: {} }),
}))
