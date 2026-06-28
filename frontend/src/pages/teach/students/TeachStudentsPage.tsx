import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { ArrowLeft, Users, Target, BookCheck, UserMinus } from 'lucide-react'
import { Avatar, Badge, Button, Card, Dialog, Input, Link as RouterLink, NativeButton, Skeleton, showToast } from '@shared/ui'
import { groupsApi, extractApiError } from '@shared/api'
import type { AllStudentRow } from '@shared/api'

type SortKey = 'name' | 'accuracy' | 'lessons'

export function TeachStudentsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [onlyAttention, setOnlyAttention] = useState(false)
  const [manage, setManage] = useState<AllStudentRow | null>(null)

  const query = useQuery({ queryKey: ['students', 'all'], queryFn: groupsApi.allStudents })
  const all = query.data ?? []

  const removeMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsApi.removeMember(groupId, userId),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['students', 'all'] }),
        qc.invalidateQueries({ queryKey: ['groups'] }),
      ])
      showToast({ type: 'info', title: 'Removed from group' })
      setManage(null)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const q = search.trim().toLowerCase()
  const rows = [...all]
    .filter((r) => !q || `${r.user.firstName} ${r.user.lastName ?? ''}`.toLowerCase().includes(q))
    .filter((r) => !onlyAttention || r.stats.needsAttention)
    .sort((a, b) => {
      if (sortKey === 'accuracy') return b.stats.accuracyPercent - a.stats.accuracyPercent
      if (sortKey === 'lessons') return b.stats.completedLessons - a.stats.completedLessons
      return `${a.user.firstName} ${a.user.lastName ?? ''}`.localeCompare(`${b.user.firstName} ${b.user.lastName ?? ''}`)
    })

  const attentionCount = all.filter((r) => r.stats.needsAttention).length

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1000px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink to="/teach" display="inline-flex" alignItems="center" gap="6px"
            fontSize="sm" color="text.tertiary" textDecoration="none" _hover={{ color: 'text.primary' }}>
            <ArrowLeft size={14} /> Overview
          </RouterLink>
        </Box>

        <Stack gap="6px" mb="20px">
          <Heading as="h1" fontSize={{ base: '3xl', md: '4xl' }} fontWeight="semibold" letterSpacing="tight">
            Students
          </Heading>
          <Text fontSize="md" color="text.secondary">
            Everyone across your groups, with accuracy and progress.
          </Text>
        </Stack>

        {query.isLoading ? (
          <Stack gap="8px">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} h="60px" borderRadius="md" />)}
          </Stack>
        ) : all.length === 0 ? (
          <Card padding="spacious">
            <Stack gap="6px" align="center" textAlign="center" py="24px">
              <Box color="text.tertiary"><Users size={22} /></Box>
              <Text fontSize="md" fontWeight="semibold">No students yet</Text>
              <Text fontSize="sm" color="text.secondary">
                Create a group and share its invite code to add students.
              </Text>
              <Box mt="8px">
                <Button size="sm" onClick={() => navigate('/teach/groups')}>Go to groups</Button>
              </Box>
            </Stack>
          </Card>
        ) : (
          <>
            <Flex align="center" justify="space-between" gap="12px" mb="16px" wrap="wrap">
              <Flex gap="6px" align="center" wrap="wrap">
                {([
                  { v: 'name', label: 'Name' },
                  { v: 'accuracy', label: 'Accuracy' },
                  { v: 'lessons', label: 'Lessons' },
                ] as const).map((o) => (
                  <Chip key={o.v} active={sortKey === o.v} onClick={() => setSortKey(o.v)}>{o.label}</Chip>
                ))}
                <Chip active={onlyAttention} onClick={() => setOnlyAttention((v) => !v)}>
                  Needs attention{attentionCount > 0 ? ` (${attentionCount})` : ''}
                </Chip>
              </Flex>
              <Box w="200px">
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students…" />
              </Box>
            </Flex>

            <Card padding="tight">
              <Stack gap="0" maxH="62vh" overflowY="auto">
                {rows.map((r, idx) => {
                  const fullName = `${r.user.firstName}${r.user.lastName ? ` ${r.user.lastName}` : ''}`
                  const groupId = r.groups[0]?.id
                  return (
                    <Flex key={r.user.id} align="center" gap="12px" wrap="wrap" py="12px" px="12px"
                      borderTop={idx === 0 ? 'none' : '1px solid'} borderColor="border.subtle">
                      <Flex align="center" gap="12px" flex="1" minW="0">
                        <Avatar size="sm" name={fullName} src={r.user.avatarUrl} />
                        <Box flex="1" minW="0">
                          <Flex align="center" gap="8px" wrap="wrap">
                            <Text fontSize="sm" fontWeight="medium" lineHeight="tight" truncate>{fullName}</Text>
                            {r.stats.needsAttention && (
                              <Badge tone="error" intensity="subtle" shape="pill">needs attention</Badge>
                            )}
                          </Flex>
                          <Text fontSize="xs" color="text.tertiary" truncate>
                            {r.groups.map((g) => g.name).join(', ')}
                          </Text>
                        </Box>
                      </Flex>
                      <Flex gap="12px" align="center" justify={{ base: 'space-between', sm: 'flex-end' }}
                        w={{ base: '100%', sm: 'auto' }} flexShrink={0}>
                        <Flex gap="16px" align="center">
                          <Stat icon={<Target size={12} />} value={`${r.stats.accuracyPercent}%`} label="accuracy" />
                          <Box display={{ base: 'none', sm: 'block' }}>
                            <Stat icon={<BookCheck size={12} />} value={`${r.stats.completedLessons}`} label="lessons" />
                          </Box>
                        </Flex>
                        <Flex gap="2px" flexShrink={0}>
                          {groupId && (
                            <Button size="sm" variant="ghost"
                              onClick={() => navigate(`/teach/groups/${groupId}/students/${r.user.id}`)}>
                              Detail
                            </Button>
                          )}
                          <NativeButton type="button" aria-label="Remove from group" title="Remove from group"
                            onClick={() => setManage(r)}
                            display="inline-flex" alignItems="center" justifyContent="center"
                            w="32px" h="32px" bg="transparent" border="1px solid" borderColor="transparent"
                            borderRadius="md" color="text.tertiary" cursor="pointer"
                            _hover={{ bg: 'bg.subtle', color: 'error' }}>
                            <UserMinus size={14} />
                          </NativeButton>
                        </Flex>
                      </Flex>
                    </Flex>
                  )
                })}
                {rows.length === 0 && (
                  <Box p="20px" textAlign="center">
                    <Text fontSize="sm" color="text.tertiary">No students match your filters.</Text>
                  </Box>
                )}
              </Stack>
            </Card>
          </>
        )}
      </Container>

      <Dialog
        open={Boolean(manage)}
        onOpenChange={(o) => !o && setManage(null)}
        title="Remove from group"
        description={manage ? `${manage.user.firstName}${manage.user.lastName ? ` ${manage.user.lastName}` : ''} stays on the platform — only the group membership is removed.` : undefined}
      >
        {manage && (
          <Stack gap="8px">
            {manage.groups.map((g) => (
              <Flex key={g.id} align="center" justify="space-between" gap="10px"
                px="12px" py="8px" borderRadius="md" bg="bg.subtle">
                <Text fontSize="sm">{g.name}</Text>
                <Button size="sm" variant="destructive" leftIcon={<UserMinus size={12} />}
                  loading={removeMutation.isPending && removeMutation.variables?.groupId === g.id}
                  onClick={() => removeMutation.mutate({ groupId: g.id, userId: manage.user.id })}>
                  Remove
                </Button>
              </Flex>
            ))}
          </Stack>
        )}
      </Dialog>
    </Box>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <NativeButton type="button" onClick={onClick}
      px="12px" h="30px" borderRadius="full" border="1px solid"
      bg={active ? 'accent.surface' : 'bg.subtle'}
      color={active ? 'accent.text' : 'text.secondary'}
      borderColor={active ? 'border.accent' : 'border.subtle'}
      fontSize="xs" fontWeight="medium" cursor="pointer">
      {children}
    </NativeButton>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <Stack gap="0" align="flex-end" minW="48px">
      <Flex align="center" gap="4px" color="accent.text">
        <Box color="text.tertiary">{icon}</Box>
        <Text fontSize="sm" fontFamily="mono">{value}</Text>
      </Flex>
      <Text fontSize="xs" color="text.tertiary">{label}</Text>
    </Stack>
  )
}
