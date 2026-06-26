import { useRef, useState } from 'react'
import { Box, Stack, Text, Flex } from '@chakra-ui/react'
import { Image as ImageIcon, Upload } from 'lucide-react'
import { Button, Input, NativeButton, showToast } from '@shared/ui'
import { uploadsApi, extractApiError } from '@shared/api'
import type {
  CourseCategory,
  CreateCoursePayload,
  UpdateCoursePayload,
} from '@shared/api'
import type { CefrLevel } from '@entities/user'

export interface CourseFormState {
  title: string
  description: string
  category: CourseCategory
  level: CefrLevel | null
  coverImageUrl: string | null
}

const CATEGORIES: { value: CourseCategory; label: string }[] = [
  { value: 'GRAMMAR', label: 'Grammar' },
  { value: 'VOCABULARY', label: 'Vocabulary' },
  { value: 'BUSINESS_ENGLISH', label: 'Business English' },
  { value: 'IELTS', label: 'IELTS' },
  { value: 'CONVERSATION', label: 'Conversation' },
  { value: 'PRONUNCIATION', label: 'Pronunciation' },
  { value: 'LISTENING', label: 'Listening' },
  { value: 'READING', label: 'Reading' },
  { value: 'WRITING', label: 'Writing' },
  { value: 'EXAM_PREP', label: 'Exam prep' },
]
const LEVELS: (CefrLevel | 'NONE')[] = ['NONE', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export interface CourseFormProps {
  initial?: Partial<CourseFormState>
  submitting?: boolean
  submitLabel: string
  onSubmit: (payload: CreateCoursePayload | UpdateCoursePayload) => void
}

export function CourseForm({ initial, submitting, submitLabel, onSubmit }: CourseFormProps) {
  const [state, setState] = useState<CourseFormState>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    category: initial?.category ?? 'GRAMMAR',
    level: initial?.level ?? null,
    coverImageUrl: initial?.coverImageUrl ?? null,
  })
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleCoverUpload = async (file: File) => {
    setUploading(true)
    try {
      const publicUrl = await uploadsApi.uploadFile(file, 'COURSE_COVER')
      setState((s) => ({ ...s, coverImageUrl: publicUrl }))
      showToast({ type: 'success', title: 'Cover uploaded' })
    } catch (err) {
      showToast({ type: 'error', title: extractApiError(err) })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    onSubmit({
      title: state.title.trim(),
      description: state.description.trim(),
      category: state.category,
      level: state.level ?? undefined,
      coverImageUrl: state.coverImageUrl ?? undefined,
    })
  }

  const titleValid = state.title.trim().length >= 5
  const descValid = state.description.trim().length >= 20
  const canSubmit = titleValid && descValid && !submitting && !uploading

  return (
    <Stack gap="20px" maxW="640px">
      <Input
        label="Title"
        value={state.title}
        onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
        placeholder="Beginner English Grammar"
        hint="Minimum 5 characters."
      />

      <Box>
        <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
          Description
        </Text>
        <textarea
          value={state.description}
          onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
          rows={5}
          placeholder="What will students learn? (minimum 20 characters)"
          style={{
            width: '100%',
            padding: '12px 14px',
            background: 'var(--se-colors-bg-surface)',
            border: '1px solid var(--se-colors-border-default)',
            borderRadius: 10,
            color: 'var(--se-colors-text-primary)',
            fontSize: 14,
            fontFamily: 'inherit',
            lineHeight: 1.5,
            resize: 'vertical',
            outline: 'none',
          }}
        />
      </Box>

      <Box>
        <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
          Category
        </Text>
        <Flex wrap="wrap" gap="6px">
          {CATEGORIES.map((c) => {
            const active = state.category === c.value
            return (
              <Box
                key={c.value}
                as="button"
                onClick={() => setState((s) => ({ ...s, category: c.value }))}
                px="12px"
                h="32px"
                display="inline-flex"
                alignItems="center"
                borderRadius="full"
                bg={active ? 'accent.surface' : 'bg.subtle'}
                color={active ? 'accent.text' : 'text.secondary'}
                border="1px solid"
                borderColor={active ? 'border.accent' : 'border.subtle'}
                fontSize="xs"
                fontWeight="medium"
                cursor="pointer"
              >
                {c.label}
              </Box>
            )
          })}
        </Flex>
      </Box>

      <Box>
        <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
          Level (optional)
        </Text>
        <Flex wrap="wrap" gap="6px">
          {LEVELS.map((lvl) => {
            const active = state.level === (lvl === 'NONE' ? null : lvl)
            return (
              <Box
                key={lvl}
                as="button"
                onClick={() => setState((s) => ({ ...s, level: lvl === 'NONE' ? null : (lvl as CefrLevel) }))}
                px="12px"
                h="32px"
                display="inline-flex"
                alignItems="center"
                borderRadius="full"
                bg={active ? 'accent.surface' : 'bg.subtle'}
                color={active ? 'accent.text' : 'text.secondary'}
                border="1px solid"
                borderColor={active ? 'border.accent' : 'border.subtle'}
                fontSize="xs"
                fontWeight="medium"
                cursor="pointer"
              >
                {lvl === 'NONE' ? 'Any' : lvl}
              </Box>
            )
          })}
        </Flex>
      </Box>

      <Box>
        <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
          Cover image (optional)
        </Text>
        <Flex gap="12px" align="center">
          <Box
            w="120px"
            h="68px"
            borderRadius="md"
            bg="bg.subtle"
            border="1px solid"
            borderColor="border.subtle"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="text.tertiary"
            backgroundImage={state.coverImageUrl ? `url(${state.coverImageUrl})` : undefined}
            backgroundSize="cover"
            backgroundPosition="center"
            flexShrink={0}
          >
            {!state.coverImageUrl && <ImageIcon size={16} />}
          </Box>
          <Stack gap="6px">
            <NativeButton
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              display="inline-flex"
              alignItems="center"
              gap="6px"
              h="32px"
              px="12px"
              bg="bg.surface"
              border="1px solid"
              borderColor="border.default"
              borderRadius="md"
              color="text.primary"
              fontSize="sm"
              cursor="pointer"
              _hover={{ bg: 'bg.subtle' }}
            >
              <Upload size={12} />
              {uploading ? 'Uploading…' : 'Upload'}
            </NativeButton>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleCoverUpload(file)
                e.target.value = ''
              }}
            />
            {state.coverImageUrl && (
              <NativeButton
                type="button"
                onClick={() => setState((s) => ({ ...s, coverImageUrl: null }))}
                bg="transparent"
                border="none"
                color="error"
                fontSize="xs"
                cursor="pointer"
                textAlign="left"
              >
                Remove cover
              </NativeButton>
            )}
          </Stack>
        </Flex>
      </Box>

      <Flex justify="flex-end">
        <Button onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
          {submitLabel}
        </Button>
      </Flex>
    </Stack>
  )
}
