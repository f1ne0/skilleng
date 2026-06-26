import { useState } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { Plus, X } from 'lucide-react'
import { Button, Input, NativeButton } from '@shared/ui'
import type { QuestionType } from '@entities/question'
import type {
  CreateQuestionPayload,
  UpdateQuestionPayload,
} from '@shared/api'

const TYPES: { value: QuestionType; label: string }[] = [
  { value: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
  { value: 'FILL_BLANK', label: 'Fill the blank' },
  { value: 'DRAG_DROP', label: 'Drag & drop' },
  { value: 'MATCH_PAIRS', label: 'Match pairs' },
  { value: 'SHORT_WRITING', label: 'Short writing' },
  { value: 'SPEAKING_RESPONSE', label: 'Speaking' },
]

interface MCPayload { options: string[]; correctIndex: number }
interface FBPayload { text: string; correctAnswers: string[]; caseSensitive: boolean }
interface DDPayload { words: string[] }
interface MPPayload { pairs: { left: string; right: string }[] }
interface SWPayload { minWords: number; maxWords: number; rubric: string }
interface SPPayload { expectedKeyPoints: string[]; minSeconds: number; maxSeconds: number }

interface State {
  type: QuestionType
  prompt: string
  explanation: string
  points: number
  mc: MCPayload
  fb: FBPayload
  dd: DDPayload
  mp: MPPayload
  sw: SWPayload
  sp: SPPayload
}

function defaultState(): State {
  return {
    type: 'MULTIPLE_CHOICE',
    prompt: '',
    explanation: '',
    points: 10,
    mc: { options: ['', ''], correctIndex: 0 },
    fb: { text: '', correctAnswers: [''], caseSensitive: false },
    dd: { words: ['', ''] },
    mp: { pairs: [{ left: '', right: '' }, { left: '', right: '' }] },
    sw: { minWords: 30, maxWords: 200, rubric: '' },
    sp: { expectedKeyPoints: [''], minSeconds: 20, maxSeconds: 120 },
  }
}

export interface QuestionFormProps {
  initial?: {
    type: QuestionType
    prompt: string
    explanation: string | null
    points: number
    payload: Record<string, unknown>
  }
  submitting?: boolean
  submitLabel: string
  onSubmit: (payload: CreateQuestionPayload | UpdateQuestionPayload) => void
}

export function QuestionForm({ initial, submitting, submitLabel, onSubmit }: QuestionFormProps) {
  const [state, setState] = useState<State>(() => {
    const base = defaultState()
    if (!initial) return base
    base.type = initial.type
    base.prompt = initial.prompt
    base.explanation = initial.explanation ?? ''
    base.points = initial.points
    const p = initial.payload
    switch (initial.type) {
      case 'MULTIPLE_CHOICE':
        base.mc = {
          options: Array.isArray(p.options) ? (p.options as string[]) : ['', ''],
          correctIndex: typeof p.correctIndex === 'number' ? (p.correctIndex as number) : 0,
        }
        break
      case 'FILL_BLANK':
        base.fb = {
          text: typeof p.text === 'string' ? p.text : '',
          correctAnswers: Array.isArray(p.correctAnswers) ? (p.correctAnswers as string[]) : [''],
          caseSensitive: Boolean(p.caseSensitive),
        }
        break
      case 'DRAG_DROP':
        base.dd = { words: Array.isArray(p.words) ? (p.words as string[]) : ['', ''] }
        break
      case 'MATCH_PAIRS':
        base.mp = {
          pairs: Array.isArray(p.pairs)
            ? (p.pairs as { left: string; right: string }[])
            : [{ left: '', right: '' }],
        }
        break
      case 'SHORT_WRITING':
        base.sw = {
          minWords: typeof p.minWords === 'number' ? (p.minWords as number) : 30,
          maxWords: typeof p.maxWords === 'number' ? (p.maxWords as number) : 200,
          rubric: typeof p.rubric === 'string' ? p.rubric : '',
        }
        break
      case 'SPEAKING_RESPONSE':
        base.sp = {
          expectedKeyPoints: Array.isArray(p.expectedKeyPoints)
            ? (p.expectedKeyPoints as string[])
            : [''],
          minSeconds: typeof p.minSeconds === 'number' ? (p.minSeconds as number) : 20,
          maxSeconds: typeof p.maxSeconds === 'number' ? (p.maxSeconds as number) : 120,
        }
        break
    }
    return base
  })

  const buildPayload = (): Record<string, unknown> => {
    switch (state.type) {
      case 'MULTIPLE_CHOICE':
        return {
          options: state.mc.options.map((o) => o.trim()).filter(Boolean),
          correctIndex: state.mc.correctIndex,
        }
      case 'FILL_BLANK':
        return {
          text: state.fb.text,
          correctAnswers: state.fb.correctAnswers.map((a) => a.trim()).filter(Boolean),
          caseSensitive: state.fb.caseSensitive,
        }
      case 'DRAG_DROP':
        return { words: state.dd.words.map((w) => w.trim()).filter(Boolean) }
      case 'MATCH_PAIRS':
        return {
          pairs: state.mp.pairs
            .filter((p) => p.left.trim() && p.right.trim())
            .map((p) => ({ left: p.left.trim(), right: p.right.trim() })),
        }
      case 'SHORT_WRITING':
        return {
          minWords: state.sw.minWords,
          maxWords: state.sw.maxWords,
          rubric: state.sw.rubric.trim() || undefined,
        }
      case 'SPEAKING_RESPONSE': {
        const keyPoints = state.sp.expectedKeyPoints
          .map((k) => k.trim())
          .filter(Boolean)
        return {
          expectedKeyPoints: keyPoints.length > 0 ? keyPoints : undefined,
          minSeconds: state.sp.minSeconds,
          maxSeconds: state.sp.maxSeconds,
        }
      }
    }
  }

  const canSubmit = state.prompt.trim().length > 0 && !submitting

  const handleSubmit = () => {
    onSubmit({
      type: state.type,
      prompt: state.prompt.trim(),
      payload: buildPayload(),
      explanation: state.explanation.trim() || undefined,
      points: state.points,
    })
  }

  return (
    <Stack gap="20px" maxW="720px">
      <Box>
        <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
          Question type
        </Text>
        <Flex wrap="wrap" gap="6px">
          {TYPES.map((t) => {
            const active = state.type === t.value
            return (
              <Box
                key={t.value}
                as="button"
                onClick={() => setState((s) => ({ ...s, type: t.value }))}
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
                {t.label}
              </Box>
            )
          })}
        </Flex>
      </Box>

      <Input
        label="Prompt"
        value={state.prompt}
        onChange={(e) => setState((s) => ({ ...s, prompt: e.target.value }))}
        placeholder="What is the capital of France?"
      />

      <Flex gap="14px">
        <Box w="120px">
          <Input
            label="Points"
            type="number"
            value={String(state.points)}
            onChange={(e) => setState((s) => ({ ...s, points: Math.max(0, Number(e.target.value) || 0) }))}
          />
        </Box>
        <Box flex="1">
          <Input
            label="Explanation (shown after answer)"
            value={state.explanation}
            onChange={(e) => setState((s) => ({ ...s, explanation: e.target.value }))}
            placeholder="Optional hint or context"
          />
        </Box>
      </Flex>

      {state.type === 'MULTIPLE_CHOICE' && (
        <MCEditor
          value={state.mc}
          onChange={(mc) => setState((s) => ({ ...s, mc }))}
        />
      )}
      {state.type === 'FILL_BLANK' && (
        <FBEditor
          value={state.fb}
          onChange={(fb) => setState((s) => ({ ...s, fb }))}
        />
      )}
      {state.type === 'DRAG_DROP' && (
        <DDEditor
          value={state.dd}
          onChange={(dd) => setState((s) => ({ ...s, dd }))}
        />
      )}
      {state.type === 'MATCH_PAIRS' && (
        <MPEditor
          value={state.mp}
          onChange={(mp) => setState((s) => ({ ...s, mp }))}
        />
      )}
      {state.type === 'SHORT_WRITING' && (
        <SWEditor
          value={state.sw}
          onChange={(sw) => setState((s) => ({ ...s, sw }))}
        />
      )}
      {state.type === 'SPEAKING_RESPONSE' && (
        <SPEditor
          value={state.sp}
          onChange={(sp) => setState((s) => ({ ...s, sp }))}
        />
      )}

      <Flex justify="flex-end">
        <Button onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
          {submitLabel}
        </Button>
      </Flex>
    </Stack>
  )
}

function SPEditor({ value, onChange }: { value: SPPayload; onChange: (v: SPPayload) => void }) {
  const setPoint = (idx: number, text: string) =>
    onChange({
      ...value,
      expectedKeyPoints: value.expectedKeyPoints.map((p, i) => (i === idx ? text : p)),
    })
  const addPoint = () =>
    onChange({ ...value, expectedKeyPoints: [...value.expectedKeyPoints, ''] })
  const removePoint = (idx: number) =>
    onChange({
      ...value,
      expectedKeyPoints: value.expectedKeyPoints.filter((_, i) => i !== idx),
    })

  return (
    <Stack gap="14px">
      <Box>
        <FieldHeader
          label="Expected key points"
          hint="What the student should mention — AI uses these to assess relevance. Optional."
        />
        <Stack gap="8px">
          {value.expectedKeyPoints.map((point, i) => (
            <Flex key={i} gap="10px" align="center">
              <Box flex="1">
                <Input
                  value={point}
                  onChange={(e) => setPoint(i, e.target.value)}
                  placeholder="e.g. greet the interviewer"
                />
              </Box>
              <NativeButton onClick={() => removePoint(i)} aria-label="Remove key point">
                <X size={14} />
              </NativeButton>
            </Flex>
          ))}
          <Box>
            <Button variant="ghost" size="sm" onClick={addPoint}>
              <Plus size={14} /> Add key point
            </Button>
          </Box>
        </Stack>
      </Box>
      <Flex gap="14px">
        <Box>
          <FieldHeader label="Min seconds" />
          <Input
            type="number"
            min={5}
            max={600}
            value={String(value.minSeconds)}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isFinite(n)) onChange({ ...value, minSeconds: Math.round(n) })
            }}
          />
        </Box>
        <Box>
          <FieldHeader label="Max seconds" />
          <Input
            type="number"
            min={5}
            max={600}
            value={String(value.maxSeconds)}
            onChange={(e) => {
              const n = Number(e.target.value)
              if (Number.isFinite(n)) onChange({ ...value, maxSeconds: Math.round(n) })
            }}
          />
        </Box>
      </Flex>
      <Text fontSize="xs" color="text.tertiary">
        AI evaluates content, grammar and fluency — not phoneme-level pronunciation.
      </Text>
    </Stack>
  )
}

function FieldHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <Box mb="6px">
      <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
        {label}
      </Text>
      {hint && <Text fontSize="xs" color="text.tertiary" mt="2px">{hint}</Text>}
    </Box>
  )
}

function MCEditor({ value, onChange }: { value: MCPayload; onChange: (v: MCPayload) => void }) {
  const add = () => onChange({ ...value, options: [...value.options, ''] })
  const remove = (idx: number) => {
    const opts = value.options.filter((_, i) => i !== idx)
    let correctIndex = value.correctIndex
    if (idx < correctIndex) correctIndex--
    else if (idx === correctIndex) correctIndex = 0
    onChange({ options: opts, correctIndex })
  }
  return (
    <Box>
      <FieldHeader label="Options" hint="Click the radio to mark the correct answer." />
      <Stack gap="8px">
        {value.options.map((opt, i) => (
          <Flex key={i} gap="10px" align="center">
            <Box as="label" display="flex" alignItems="center" cursor="pointer">
              <input
                type="radio"
                name="mc-correct"
                checked={value.correctIndex === i}
                onChange={() => onChange({ ...value, correctIndex: i })}
              />
            </Box>
            <Box flex="1">
              <Input
                value={opt}
                onChange={(e) => {
                  const next = [...value.options]
                  next[i] = e.target.value
                  onChange({ ...value, options: next })
                }}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
              />
            </Box>
            {value.options.length > 2 && (
              <RemoveButton onClick={() => remove(i)} />
            )}
          </Flex>
        ))}
      </Stack>
      <Button size="sm" variant="ghost" leftIcon={<Plus size={12} />} onClick={add} disabled={value.options.length >= 8}>
        Add option
      </Button>
    </Box>
  )
}

function FBEditor({ value, onChange }: { value: FBPayload; onChange: (v: FBPayload) => void }) {
  const add = () => onChange({ ...value, correctAnswers: [...value.correctAnswers, ''] })
  const remove = (idx: number) => onChange({ ...value, correctAnswers: value.correctAnswers.filter((_, i) => i !== idx) })
  return (
    <Stack gap="14px">
      <Box>
        <FieldHeader label="Sentence" hint="Use ___ (three underscores) to mark the blank." />
        <Input
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Yesterday I ___ to the store."
        />
      </Box>
      <Box>
        <FieldHeader label="Accepted answers" hint="Add alternatives that count as correct (e.g. 'go', 'walk')." />
        <Stack gap="8px">
          {value.correctAnswers.map((a, i) => (
            <Flex key={i} gap="10px" align="center">
              <Box flex="1">
                <Input
                  value={a}
                  onChange={(e) => {
                    const next = [...value.correctAnswers]
                    next[i] = e.target.value
                    onChange({ ...value, correctAnswers: next })
                  }}
                  placeholder="answer"
                />
              </Box>
              {value.correctAnswers.length > 1 && <RemoveButton onClick={() => remove(i)} />}
            </Flex>
          ))}
        </Stack>
        <Button size="sm" variant="ghost" leftIcon={<Plus size={12} />} onClick={add} disabled={value.correctAnswers.length >= 10}>
          Add alternative
        </Button>
      </Box>
      <Flex align="center" gap="10px">
        <input
          type="checkbox"
          checked={value.caseSensitive}
          onChange={(e) => onChange({ ...value, caseSensitive: e.target.checked })}
        />
        <Text fontSize="sm">Case-sensitive matching</Text>
      </Flex>
    </Stack>
  )
}

function DDEditor({ value, onChange }: { value: DDPayload; onChange: (v: DDPayload) => void }) {
  const add = () => onChange({ words: [...value.words, ''] })
  const remove = (idx: number) => onChange({ words: value.words.filter((_, i) => i !== idx) })
  return (
    <Box>
      <FieldHeader label="Words in correct order" hint="Backend shuffles them for the student." />
      <Stack gap="8px">
        {value.words.map((w, i) => (
          <Flex key={i} gap="10px" align="center">
            <Box flex="1">
              <Input
                value={w}
                onChange={(e) => {
                  const next = [...value.words]
                  next[i] = e.target.value
                  onChange({ words: next })
                }}
                placeholder={`Word ${i + 1}`}
              />
            </Box>
            {value.words.length > 2 && <RemoveButton onClick={() => remove(i)} />}
          </Flex>
        ))}
      </Stack>
      <Button size="sm" variant="ghost" leftIcon={<Plus size={12} />} onClick={add} disabled={value.words.length >= 20}>
        Add word
      </Button>
    </Box>
  )
}

function MPEditor({ value, onChange }: { value: MPPayload; onChange: (v: MPPayload) => void }) {
  const add = () => onChange({ pairs: [...value.pairs, { left: '', right: '' }] })
  const remove = (idx: number) => onChange({ pairs: value.pairs.filter((_, i) => i !== idx) })
  return (
    <Box>
      <FieldHeader label="Pairs to match" />
      <Stack gap="8px">
        {value.pairs.map((p, i) => (
          <Flex key={i} gap="10px" align="center">
            <Box flex="1">
              <Input
                value={p.left}
                onChange={(e) => {
                  const next = value.pairs.map((x, j) => (j === i ? { ...x, left: e.target.value } : x))
                  onChange({ pairs: next })
                }}
                placeholder="Left"
              />
            </Box>
            <Box flex="1">
              <Input
                value={p.right}
                onChange={(e) => {
                  const next = value.pairs.map((x, j) => (j === i ? { ...x, right: e.target.value } : x))
                  onChange({ pairs: next })
                }}
                placeholder="Right"
              />
            </Box>
            {value.pairs.length > 2 && <RemoveButton onClick={() => remove(i)} />}
          </Flex>
        ))}
      </Stack>
      <Button size="sm" variant="ghost" leftIcon={<Plus size={12} />} onClick={add} disabled={value.pairs.length >= 10}>
        Add pair
      </Button>
    </Box>
  )
}

function SWEditor({ value, onChange }: { value: SWPayload; onChange: (v: SWPayload) => void }) {
  return (
    <Stack gap="14px">
      <Flex gap="14px">
        <Box flex="1">
          <Input
            label="Minimum words"
            type="number"
            value={String(value.minWords)}
            onChange={(e) => onChange({ ...value, minWords: Math.max(1, Number(e.target.value) || 1) })}
          />
        </Box>
        <Box flex="1">
          <Input
            label="Maximum words"
            type="number"
            value={String(value.maxWords)}
            onChange={(e) => onChange({ ...value, maxWords: Math.max(value.minWords, Number(e.target.value) || value.minWords) })}
          />
        </Box>
      </Flex>
      <Box>
        <FieldHeader label="Rubric (used by AI for grading)" />
        <textarea
          value={value.rubric}
          onChange={(e) => onChange({ ...value, rubric: e.target.value })}
          rows={4}
          placeholder="Describe what a good answer looks like: structure, key points, etc."
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
    </Stack>
  )
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <NativeButton
      type="button"
      onClick={onClick}
      aria-label="Remove"
      w="28px"
      h="28px"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      bg="transparent"
      border="none"
      color="text.tertiary"
      borderRadius="sm"
      cursor="pointer"
      _hover={{ color: 'error', bg: 'rgba(244,63,94,0.10)' }}
    >
      <X size={14} />
    </NativeButton>
  )
}
