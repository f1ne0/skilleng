import { useState } from 'react'
import { Box, Flex, Heading, Stack } from '@chakra-ui/react'
import { BookMarked } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { MessageContent, Button } from '@shared/ui'
import { AddWordDialog } from '@features/vocabulary-add'
import type { TheoryStep } from '../types'

export function StepTheory({ step }: { step: TheoryStep }) {
  // lessonSlug в URL — это на самом деле lessonId (бэкенд без слагов)
  const { lessonSlug } = useParams<{ lessonSlug: string }>()
  const [addOpen, setAddOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState('')

  // Выделил слово в теории → префиллим диалог добавления в словарь
  const openAddDialog = () => {
    const selection = window.getSelection()?.toString().trim() ?? ''
    setSelectedTerm(selection.slice(0, 100))
    setAddOpen(true)
  }

  return (
    <Stack gap="20px">
      <Flex justify="space-between" align="flex-start" gap="12px" wrap="wrap">
        <Heading
          as="h2"
          fontSize={{ base: '2xl', md: '3xl' }}
          fontWeight="semibold"
          letterSpacing="tight"
          lineHeight="tight"
        >
          {step.title}
        </Heading>
        <Button size="sm" variant="ghost" onClick={openAddDialog}>
          <BookMarked size={15} /> Add to vocabulary
        </Button>
      </Flex>
      <Box>
        <MessageContent text={step.body} />
      </Box>

      <AddWordDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        initialTerm={selectedTerm}
        sourceLessonId={lessonSlug}
      />
    </Stack>
  )
}
