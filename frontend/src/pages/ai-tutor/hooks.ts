import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { aiApi, extractApiError, type ConversationDetail } from '@shared/api'
import { showToast } from '@shared/ui'
import { adaptConversation, adaptConversationSummary } from './adapter'
import type { Conversation } from './types'
import { useChatStore } from './store'

const KEYS = {
  list: ['ai', 'conversations'] as const,
  detail: (id: string) => ['ai', 'conversations', id] as const,
}

// последовательные временные id для оптимистичных сообщений (без Date.now в хуке)
let tmpSeq = 0
const tempId = (p: string) => `temp-${p}-${(tmpSeq += 1)}`

// текущий запрос к AI — чтобы можно было отменить (Stop)
let activeAbort: AbortController | null = null

export function useConversationsList() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: aiApi.listConversations,
    select: (data) => data.map(adaptConversationSummary),
  })
}

export function useActiveConversation(id: string | null) {
  return useQuery({
    queryKey: id ? KEYS.detail(id) : ['ai', 'conversations', 'none'],
    queryFn: () => aiApi.getConversation(id!),
    enabled: Boolean(id),
    select: (data) => adaptConversation(data),
  })
}

export function useRenameConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      aiApi.renameConversation(id, title),
    onSuccess: async (_, { id }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: KEYS.list }),
        qc.invalidateQueries({ queryKey: KEYS.detail(id) }),
      ])
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })
}

export function useDeleteConversation() {
  const qc = useQueryClient()
  const selectConversation = useChatStore((s) => s.selectConversation)
  const activeId = useChatStore((s) => s.activeId)

  return useMutation({
    mutationFn: (id: string) => aiApi.deleteConversation(id),
    onSuccess: async (_, id) => {
      if (activeId === id) selectConversation(null)
      qc.removeQueries({ queryKey: KEYS.detail(id) })
      await qc.invalidateQueries({ queryKey: KEYS.list })
    },
    onError: (err) => {
      showToast({ type: 'error', title: extractApiError(err) })
    },
  })
}

export function useSendMessage() {
  const qc = useQueryClient()
  const activeId = useChatStore((s) => s.activeId)
  const selectConversation = useChatStore((s) => s.selectConversation)

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      activeAbort = new AbortController()
      let conversationId = activeId
      if (!conversationId) {
        const created = await aiApi.createConversation({})
        conversationId = created.id
        selectConversation(conversationId)
        // Pre-populate the cache for the new conversation.
        // ВАЖНО: (1) бэкенд create не включает messages — без нормализации
        // adaptConversation падал; (2) onMutate для нового диалога не отработал
        // (activeId ещё был null), поэтому оптимистичные сообщения — здесь,
        // иначе первый запрос показывает пустой экран до ответа AI
        const now = new Date().toISOString()
        qc.setQueryData(KEYS.detail(conversationId), {
          ...created,
          messages: [
            {
              id: tempId('user'),
              conversationId,
              role: 'USER',
              content,
              createdAt: now,
            },
            {
              id: tempId('asst'),
              conversationId,
              role: 'ASSISTANT',
              content: '',
              createdAt: now,
            },
          ],
        })
      }
      return aiApi.sendMessage(conversationId, content, activeAbort.signal)
    },
    onMutate: async (content) => {
      if (!activeId) return { conversationId: null as string | null }
      const key = KEYS.detail(activeId)
      await qc.cancelQueries({ queryKey: key })
      const prev = qc.getQueryData<ConversationDetail>(key)

      if (prev) {
        const now = new Date().toISOString()
        const next: ConversationDetail = {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: tempId('user'),
              conversationId: activeId,
              role: 'USER',
              content,
              createdAt: now,
            },
            {
              id: tempId('asst'),
              conversationId: activeId,
              role: 'ASSISTANT',
              content: '',
              createdAt: now,
            },
          ],
        }
        qc.setQueryData(key, next)
      }
      return { conversationId: activeId, prev }
    },
    onError: (err, _content, ctx) => {
      if (ctx?.conversationId && ctx.prev) {
        qc.setQueryData(KEYS.detail(ctx.conversationId), ctx.prev)
      } else {
        // новый диалог: отката нет — рефетчим, чтобы не завис "Thinking…"
        const currentId = useChatStore.getState().activeId
        if (currentId) {
          void qc.invalidateQueries({ queryKey: KEYS.detail(currentId) })
          void qc.invalidateQueries({ queryKey: KEYS.list })
        }
      }
      // отмена пользователем — не показываем ошибку
      const aborted =
        (err as { code?: string; name?: string }).code === 'ERR_CANCELED' ||
        (err as { name?: string }).name === 'CanceledError'
      if (!aborted) showToast({ type: 'error', title: extractApiError(err) })
    },
    onSuccess: async (response, _content, ctx) => {
      const conversationId = ctx?.conversationId ?? response.message.conversationId
      await Promise.all([
        qc.invalidateQueries({ queryKey: KEYS.detail(conversationId) }),
        qc.invalidateQueries({ queryKey: KEYS.list }),
      ])
    },
  })

  const abort = useCallback(() => {
    activeAbort?.abort()
  }, [])

  return Object.assign(mutation, { abort })
}

export type ConversationListItem = Conversation
