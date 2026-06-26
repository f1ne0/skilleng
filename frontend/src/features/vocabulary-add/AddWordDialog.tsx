import { useEffect, useState } from 'react'
import { Stack, Text } from '@chakra-ui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button, Dialog, Input, showToast, NativeTextarea } from '@shared/ui'
import { vocabularyApi, extractApiError } from '@shared/api'

export interface AddWordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Префилл (например, выделенное в уроке слово) */
  initialTerm?: string
  /** Урок-источник — попадёт в sourceLessonId */
  sourceLessonId?: string
}

/** Диалог "добавить слово в личный словарь" — используется на странице
 *  словаря и в плеере урока (кнопка на выделенном слове). */
export function AddWordDialog({
  open,
  onOpenChange,
  initialTerm,
  sourceLessonId,
}: AddWordDialogProps) {
  const qc = useQueryClient()
  const [term, setTerm] = useState('')
  const [translation, setTranslation] = useState('')
  const [example, setExample] = useState('')

  // при каждом открытии — свежий префилл
  useEffect(() => {
    if (open) {
      setTerm(initialTerm ?? '')
      setTranslation('')
      setExample('')
    }
  }, [open, initialTerm])

  const mutation = useMutation({
    mutationFn: () =>
      vocabularyApi.create({
        term: term.trim(),
        translation: translation.trim(),
        example: example.trim() || undefined,
        sourceLessonId,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vocabulary'] })
      showToast({ type: 'success', title: 'Added to your vocabulary' })
      onOpenChange(false)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const canSave = term.trim().length > 0 && translation.trim().length > 0

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add to vocabulary"
      description="The word will appear in your spaced-repetition reviews."
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={mutation.isPending}
            disabled={!canSave}
            onClick={() => mutation.mutate()}
          >
            Add word
          </Button>
        </>
      }
    >
      <Stack gap="12px">
        <Stack gap="4px">
          <Text fontSize="sm" color="text.secondary">Word or phrase</Text>
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="apprehensive"
            autoFocus
          />
        </Stack>
        <Stack gap="4px">
          <Text fontSize="sm" color="text.secondary">Translation</Text>
          <Input
            value={translation}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder="опасающийся"
          />
        </Stack>
        <Stack gap="4px">
          <Text fontSize="sm" color="text.secondary">Example (optional)</Text>
          <NativeTextarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="She was apprehensive about the exam."
            rows={2}
          />
        </Stack>
      </Stack>
    </Dialog>
  )
}
