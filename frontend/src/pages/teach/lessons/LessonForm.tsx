import { useState } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { Sparkles } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Input, NativeButton, showToast } from '@shared/ui'
import { contentApi, topicsApi, extractApiError } from '@shared/api'
import type { CreateLessonPayload, UpdateLessonPayload } from '@shared/api'
import type { CefrLevel } from '@shared/model'
import { RichTextEditor } from './RichTextEditor'

export interface LessonFormState {
  title: string
  description: string
  content: string
  videoUrl: string
  audioUrl: string
  durationSec: string
  isPreview: boolean
  topicId: string | null
}

export interface LessonFormProps {
  initial?: Partial<LessonFormState>
  submitting?: boolean
  submitLabel: string
  /** уровень курса — для AI-генерации текста урока */
  level?: CefrLevel
  onSubmit: (payload: CreateLessonPayload | UpdateLessonPayload) => void
}

export function LessonForm({ initial, submitting, submitLabel, level, onSubmit }: LessonFormProps) {
  const [state, setState] = useState<LessonFormState>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    content: initial?.content ?? '',
    videoUrl: initial?.videoUrl ?? '',
    audioUrl: initial?.audioUrl ?? '',
    durationSec: initial?.durationSec ?? '',
    isPreview: initial?.isPreview ?? false,
    topicId: initial?.topicId ?? null,
  })
  // ключ редактора — меняем, когда подменяем текст программно (AI), чтобы он перечитал контент
  const [editorKey, setEditorKey] = useState(0)

  const topicsQuery = useQuery({ queryKey: ['topics', 'list', 'lesson-form'], queryFn: () => topicsApi.list() })
  const topics = topicsQuery.data ?? []

  const writeMutation = useMutation({
    mutationFn: () =>
      contentApi.generateLessonText({ topic: state.title.trim(), level: level ?? 'B1' }),
    onSuccess: ({ content }) => {
      setState((s) => ({ ...s, content }))
      setEditorKey((k) => k + 1)
      showToast({ type: 'success', title: 'Lesson written' })
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const titleValid = state.title.trim().length >= 3
  const contentValid = state.content.trim().length >= 10
  const canSubmit = titleValid && contentValid && !submitting

  const handleSubmit = () => {
    const durationNum = state.durationSec ? Number(state.durationSec) : undefined
    onSubmit({
      title: state.title.trim(),
      description: state.description.trim() || undefined,
      content: state.content,
      videoUrl: state.videoUrl.trim() || undefined,
      audioUrl: state.audioUrl.trim() || undefined,
      durationSec: durationNum && !Number.isNaN(durationNum) ? durationNum : undefined,
      isPreview: state.isPreview,
      topicId: state.topicId,
    })
  }

  return (
    <Stack gap="20px" maxW="720px">
      <Input
        label="Title"
        value={state.title}
        onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
        placeholder="Present Simple — be"
        hint="Minimum 3 characters."
      />

      <Input
        label="Description (optional)"
        value={state.description}
        onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
        placeholder="What students will learn in this lesson"
      />

      {topics.length > 0 && (
        <Box>
          <Text fontSize="sm" fontWeight="medium" mb="2px">Linked topic (optional)</Text>
          <Text fontSize="xs" color="text.tertiary" mb="8px">
            Attach this lesson to a reference topic so it shows up as the topic's practice.
          </Text>
          <Flex gap="6px" wrap="wrap">
            <NativeButton type="button" onClick={() => setState((s) => ({ ...s, topicId: null }))}
              px="12px" h="30px" borderRadius="full" border="1px solid"
              bg={state.topicId === null ? 'accent.surface' : 'bg.subtle'}
              color={state.topicId === null ? 'accent.text' : 'text.secondary'}
              borderColor={state.topicId === null ? 'border.accent' : 'border.subtle'}
              fontSize="xs" fontWeight="medium" cursor="pointer">
              None
            </NativeButton>
            {topics.map((t) => {
              const active = state.topicId === t.id
              return (
                <NativeButton key={t.id} type="button"
                  onClick={() => setState((s) => ({ ...s, topicId: t.id }))}
                  px="12px" h="30px" borderRadius="full" border="1px solid"
                  bg={active ? 'accent.surface' : 'bg.subtle'}
                  color={active ? 'accent.text' : 'text.secondary'}
                  borderColor={active ? 'border.accent' : 'border.subtle'}
                  fontSize="xs" fontWeight="medium" cursor="pointer">
                  {t.title}
                </NativeButton>
              )
            })}
          </Flex>
        </Box>
      )}

      <Box>
        <Flex align={{ base: 'flex-start', sm: 'center' }} justify="space-between" gap="10px"
          mb="8px" direction={{ base: 'column', sm: 'row' }}>
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb="2px">Lesson text</Text>
            <Text fontSize="xs" color="text.tertiary">
              Type the lesson below, or let AI write a first draft from the title. What you see is what students see.
            </Text>
          </Box>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Sparkles size={13} />}
            loading={writeMutation.isPending}
            disabled={!titleValid}
            onClick={() => writeMutation.mutate()}
            title={titleValid ? 'Generate the lesson text from the title' : 'Add a title first'}
          >
            Write with AI
          </Button>
        </Flex>
        <RichTextEditor
          key={editorKey}
          initialMarkdown={state.content}
          onChange={(md) => setState((s) => ({ ...s, content: md }))}
        />
      </Box>

      <Flex gap="14px" direction={{ base: 'column', md: 'row' }}>
        <Box flex="1">
          <Input
            label="Video URL (optional)"
            value={state.videoUrl}
            onChange={(e) => setState((s) => ({ ...s, videoUrl: e.target.value }))}
            placeholder="https://..."
          />
        </Box>
        <Box flex="1">
          <Input
            label="Audio URL (optional)"
            value={state.audioUrl}
            onChange={(e) => setState((s) => ({ ...s, audioUrl: e.target.value }))}
            placeholder="https://..."
          />
        </Box>
        <Box w={{ base: '100%', md: '160px' }}>
          <Input
            label="Duration (sec)"
            type="number"
            value={state.durationSec}
            onChange={(e) => setState((s) => ({ ...s, durationSec: e.target.value }))}
            placeholder="300"
          />
        </Box>
      </Flex>

      <Flex justify="flex-end">
        <Button onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
          {submitLabel}
        </Button>
      </Flex>
    </Stack>
  )
}
