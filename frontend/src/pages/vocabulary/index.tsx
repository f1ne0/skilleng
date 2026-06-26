import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { BookMarked, Plus, Trash2, Repeat } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { vocabularyApi, extractApiError } from '@shared/api'
import type { VocabularyEntry } from '@shared/api'
import {
  Badge,
  Button,
  Card,
  Dialog,
  Input,
  NativeButton,
  Skeleton,
  showToast,
} from '@shared/ui'
import { staggerContainer, fadeUp } from '@shared/motion'
import { AddWordDialog } from '@features/vocabulary-add'

export function VocabularyPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const listQuery = useQuery({
    queryKey: ['vocabulary', 'list', search],
    queryFn: () => vocabularyApi.list({ search: search || undefined, limit: 100 }),
  })
  const statsQuery = useQuery({
    queryKey: ['vocabulary', 'stats'],
    queryFn: vocabularyApi.stats,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vocabularyApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['vocabulary'] })
      setPendingDelete(null)
      showToast({ type: 'info', title: 'Word removed' })
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const items = listQuery.data?.items ?? []
  const stats = statsQuery.data

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1280px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Flex justify="space-between" align="flex-start" wrap="wrap" gap="16px" mb="24px">
              <Stack gap="6px">
                <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
                  My vocabulary
                </Heading>
                <Text fontSize="md" color="text.secondary">
                  {stats
                    ? `${stats.total} words · ${stats.learned} learned · ${stats.dueNow} due for review`
                    : 'Words you save from lessons, scheduled with spaced repetition.'}
                </Text>
              </Stack>
              <Flex gap="10px">
                {(stats?.dueNow ?? 0) > 0 && (
                  <Button size="sm" onClick={() => navigate('/vocabulary/review')}>
                    <Repeat size={16} /> Review {stats!.dueNow} due
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
                  <Plus size={16} /> Add word
                </Button>
              </Flex>
            </Flex>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Box maxW="360px" mb="20px">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search words…"
              />
            </Box>
          </motion.div>

          <motion.div variants={fadeUp}>
            {listQuery.isLoading ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="14px">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} h="120px" borderRadius="lg" />
                ))}
              </SimpleGrid>
            ) : listQuery.error ? (
              <Card padding="comfortable">
                <Text fontSize="sm" color="text.secondary">{extractApiError(listQuery.error)}</Text>
              </Card>
            ) : items.length === 0 ? (
              <EmptyState onAdd={() => setAddOpen(true)} hasSearch={Boolean(search)} />
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap="14px">
                {items.map((entry) => (
                  <WordCard
                    key={entry.id}
                    entry={entry}
                    onDelete={() => setPendingDelete(entry.id)}
                  />
                ))}
              </SimpleGrid>
            )}
          </motion.div>
        </motion.div>
      </Container>

      <AddWordDialog open={addOpen} onOpenChange={setAddOpen} />

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remove word?"
        description="Its review history will be deleted as well."
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => pendingDelete && deleteMutation.mutate(pendingDelete)}
            >
              Remove
            </Button>
          </>
        }
      />
    </Box>
  )
}

function WordCard({ entry, onDelete }: { entry: VocabularyEntry; onDelete: () => void }) {
  const due = new Date(entry.dueAt) <= new Date()
  const learned = entry.intervalDays >= 21

  return (
    <Card padding="comfortable">
      <Flex justify="space-between" align="flex-start" gap="8px">
        <Stack gap="4px" flex="1" minW="0">
          <Flex align="center" gap="8px" wrap="wrap">
            <Text fontSize="md" fontWeight="semibold">{entry.term}</Text>
            {entry.partOfSpeech && (
              <Badge tone="neutral" shape="pill">{entry.partOfSpeech}</Badge>
            )}
            {learned ? (
              <Badge tone="success" shape="pill">learned</Badge>
            ) : due ? (
              <Badge tone="warning" shape="pill">due</Badge>
            ) : null}
          </Flex>
          <Text fontSize="sm" color="text.secondary">{entry.translation}</Text>
          {entry.example && (
            <Text fontSize="xs" color="text.tertiary" fontStyle="italic" lineClamp={2}>
              {entry.example}
            </Text>
          )}
        </Stack>
        <NativeButton onClick={onDelete} aria-label="Remove word">
          <Trash2 size={15} />
        </NativeButton>
      </Flex>
    </Card>
  )
}

function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <Card padding="spacious">
        <Stack align="center" textAlign="center" gap="8px" py="16px">
          <Text fontSize="md" fontWeight="semibold">Nothing found</Text>
          <Text fontSize="sm" color="text.secondary">Try a different search.</Text>
        </Stack>
      </Card>
    )
  }
  return (
    <Card padding="spacious">
      <Stack align="center" textAlign="center" gap="10px" py="24px">
        <BookMarked size={28} />
        <Text fontSize="md" fontWeight="semibold">Your vocabulary is empty</Text>
        <Text fontSize="sm" color="text.secondary" maxW="420px">
          Save words while reading lessons — spaced repetition will schedule
          reviews right before you'd forget them.
        </Text>
        <Flex gap="10px" mt="6px">
          <Button size="sm" onClick={onAdd}>
            <Plus size={16} /> Add your first word
          </Button>
          <Link to="/courses">
            <Button size="sm" variant="secondary">Browse lessons</Button>
          </Link>
        </Flex>
      </Stack>
    </Card>
  )
}
