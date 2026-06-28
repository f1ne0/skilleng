import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Container, Flex, Heading, SimpleGrid, Stack, Text,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Copy, RefreshCw, Trash2, Users, UserMinus, UserPlus, Target, BookCheck, AlertTriangle, Pencil,
} from 'lucide-react'
import { useState } from 'react'
import {
  Avatar, Badge, Button, Card, Dialog, Input, Link as RouterLink, NativeButton, Skeleton, showToast,
} from '@shared/ui'
import { groupsApi, extractApiError } from '@shared/api'
import { staggerContainer, fadeUp } from '@shared/motion'

export function TeachGroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pendingKick, setPendingKick] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [addEmail, setAddEmail] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'name' | 'accuracy' | 'lessons'>('name')

  const detailQuery = useQuery({
    queryKey: ['groups', 'detail', id],
    queryFn: () => groupsApi.byId(id!),
    enabled: Boolean(id),
  })
  const analyticsQuery = useQuery({
    queryKey: ['groups', 'analytics', id],
    queryFn: () => groupsApi.analytics(id!),
    enabled: Boolean(id),
  })

  const invalidate = () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['groups', 'my'] }),
      qc.invalidateQueries({ queryKey: ['groups', 'detail', id] }),
      qc.invalidateQueries({ queryKey: ['groups', 'analytics', id] }),
    ])

  const regenerateMutation = useMutation({
    mutationFn: () => groupsApi.regenerateCode(id!),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Invite code regenerated' })
      await invalidate()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => groupsApi.removeMember(id!, userId),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Student removed' })
      await invalidate()
      setPendingKick(null)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const updateMutation = useMutation({
    mutationFn: () => groupsApi.update(id!, {
      name: editName.trim(),
      description: editDesc.trim() || undefined,
    }),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Group updated' })
      setEditing(false)
      await invalidate()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const allStudentsQuery = useQuery({
    queryKey: ['students', 'all'],
    queryFn: groupsApi.allStudents,
    enabled: addOpen,
  })

  const addMemberMutation = useMutation({
    mutationFn: (payload: { email?: string; userId?: string }) => groupsApi.addMember(id!, payload),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Student added' })
      await invalidate()
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const deleteMutation = useMutation({
    mutationFn: () => groupsApi.delete(id!),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Group deleted' })
      await invalidate()
      navigate('/teach/groups')
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  if (detailQuery.isLoading) return <DetailSkeleton />
  if (detailQuery.isError) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="900px" py="32px">
          <Card padding="comfortable">
            <Text fontSize="sm" color="error">{extractApiError(detailQuery.error)}</Text>
          </Card>
        </Container>
      </Box>
    )
  }
  if (!detailQuery.data) return <Navigate to="/teach/groups" replace />

  const group = detailQuery.data
  const analytics = analyticsQuery.data

  const q = search.trim().toLowerCase()
  const members = [...group.memberships]
    .filter((m) => !q || `${m.user.firstName} ${m.user.lastName ?? ''}`.toLowerCase().includes(q))
    .sort((a, b) => {
      if (sortKey === 'accuracy') return (b.stats?.accuracyPercent ?? 0) - (a.stats?.accuracyPercent ?? 0)
      if (sortKey === 'lessons') return (b.stats?.completedLessons ?? 0) - (a.stats?.completedLessons ?? 0)
      return `${a.user.firstName} ${a.user.lastName ?? ''}`.localeCompare(`${b.user.firstName} ${b.user.lastName ?? ''}`)
    })

  const copyInvite = async () => {
    if (!group.inviteCode) return
    try {
      await navigator.clipboard.writeText(group.inviteCode)
      showToast({ type: 'success', title: 'Invite code copied' })
    } catch {
      showToast({ type: 'error', title: 'Could not copy' })
    }
  }

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1000px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink
            to="/teach/groups"
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="sm"
            color="text.tertiary"
            textDecoration="none"
            _hover={{ color: 'text.primary' }}
          >
            <ArrowLeft size={14} />
            Groups
          </RouterLink>
        </Box>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Card variant="hero" padding="spacious" style={{ marginBottom: 24 }}>
              <Stack gap="14px">
                <Flex justify="space-between" align="flex-start" gap="12px" wrap="wrap">
                  <Stack gap="10px" flex="1" minW="0">
                    <Heading
                      as="h1"
                      fontSize={{ base: '2xl', md: '3xl' }}
                      fontWeight="semibold"
                      letterSpacing="tight"
                      lineHeight="tight"
                    >
                      {group.name}
                    </Heading>
                    {group.description && (
                      <Text fontSize="md" color="text.secondary" lineHeight="relaxed">
                        {group.description}
                      </Text>
                    )}
                  </Stack>
                  <Flex gap="6px" flexShrink={0} w={{ base: '100%', sm: 'auto' }}>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Pencil size={12} />}
                      onClick={() => { setEditName(group.name); setEditDesc(group.description ?? ''); setEditing(true) }}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      leftIcon={<Trash2 size={12} />}
                      onClick={() => setConfirmDelete(true)}
                    >
                      Delete
                    </Button>
                  </Flex>
                </Flex>
                {group.inviteCode && (
                  <Flex
                    align="center"
                    gap="10px"
                    p="10px 12px"
                    bg="bg.subtle"
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="md"
                    maxW="380px"
                    wrap="wrap"
                  >
                    <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
                      Invite
                    </Text>
                    <Text
                      flex="1"
                      fontFamily="mono"
                      fontSize="lg"
                      fontWeight="semibold"
                      letterSpacing="widest"
                    >
                      {group.inviteCode}
                    </Text>
                    <Button size="sm" variant="ghost" leftIcon={<Copy size={12} />} onClick={copyInvite}>
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<RefreshCw size={12} />}
                      onClick={() => regenerateMutation.mutate()}
                      loading={regenerateMutation.isPending}
                    >
                      Regenerate
                    </Button>
                  </Flex>
                )}
              </Stack>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap="14px" mb="24px">
              <StatTile
                label="Members"
                value={analytics ? `${analytics.totalMembers}` : '—'}
                icon={<Users size={14} />}
              />
              <StatTile
                label="Avg accuracy"
                value={analytics ? `${analytics.avgAccuracy}%` : '—'}
                icon={<Target size={14} />}
              />
              <StatTile
                label="Avg lessons done"
                value={analytics ? `${analytics.avgLessons}` : '—'}
                icon={<BookCheck size={14} />}
              />
              <StatTile
                label="Need attention"
                value={analytics ? `${analytics.needsAttention}` : '—'}
                icon={<AlertTriangle size={14} />}
                tone={analytics && analytics.needsAttention > 0 ? 'error' : undefined}
              />
            </SimpleGrid>
          </motion.div>

          {analytics && analytics.weeklyActivity.length > 0 && (
            <motion.div variants={fadeUp}>
              <Stack gap="10px" mb="24px">
                <Heading as="h2" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
                  Activity this week
                </Heading>
                <Card padding="comfortable">
                  <WeeklyBars data={analytics.weeklyActivity} />
                </Card>
              </Stack>
            </motion.div>
          )}

          {analytics && analytics.topByAccuracy.length > 0 && (
            <motion.div variants={fadeUp}>
              <Stack gap="14px" mb="24px">
                <Heading as="h2" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
                  Top by accuracy
                </Heading>
                <Card padding="tight">
                  <Stack gap="0">
                    {analytics.topByAccuracy.map((entry, idx) => {
                      const fullName = `${entry.firstName}${entry.lastName ? ` ${entry.lastName}` : ''}`
                      return (
                        <Flex key={entry.userId} align="center" gap="12px" py="12px" px="12px"
                          borderTop={idx === 0 ? 'none' : '1px solid'} borderColor="border.subtle"
                          role="button" cursor="pointer" _hover={{ bg: 'bg.subtle' }}
                          onClick={() => navigate(`/teach/groups/${id}/students/${entry.userId}`)}>
                          <Box w="28px" textAlign="center" color="accent.text" fontFamily="mono" fontSize="sm">
                            #{idx + 1}
                          </Box>
                          <Avatar size="sm" name={fullName} src={entry.avatarUrl} />
                          <Text flex="1" fontSize="sm" fontWeight="medium" truncate>{fullName}</Text>
                          <Text fontSize="sm" fontFamily="mono" color="accent.text">{entry.accuracyPercent}%</Text>
                        </Flex>
                      )
                    })}
                  </Stack>
                </Card>
              </Stack>
            </motion.div>
          )}

          {analytics && analytics.topByXp.length > 0 && (
            <motion.div variants={fadeUp}>
              <Stack gap="14px" mb="24px">
                <Heading as="h2" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
                  Top performers
                </Heading>
                <Card padding="tight">
                  <Stack gap="0">
                    {analytics.topByXp.map((entry, idx) => {
                      const fullName = `${entry.firstName}${entry.lastName ? ` ${entry.lastName}` : ''}`
                      return (
                        <Flex
                          key={entry.userId}
                          align="center"
                          gap="12px"
                          py="12px"
                          px="12px"
                          borderTop={idx === 0 ? 'none' : '1px solid'}
                          borderColor="border.subtle"
                          role="button"
                          cursor="pointer"
                          _hover={{ bg: 'bg.subtle' }}
                          onClick={() =>
                            navigate(`/teach/groups/${id}/students/${entry.userId}`)
                          }
                        >
                          <Box w="28px" textAlign="center" color="warning" fontFamily="mono" fontSize="sm">
                            #{idx + 1}
                          </Box>
                          <Avatar size="sm" name={fullName} src={entry.avatarUrl} />
                          <Text flex="1" fontSize="sm" fontWeight="medium" truncate>
                            {fullName}
                          </Text>
                          <Text fontSize="sm" fontFamily="mono" color="accent.text">
                            {(entry.totalXp ?? 0).toLocaleString()} XP
                          </Text>
                        </Flex>
                      )
                    })}
                  </Stack>
                </Card>
              </Stack>
            </motion.div>
          )}

          <motion.div variants={fadeUp}>
            <Stack gap="14px">
              <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap="12px"
                wrap="wrap" direction={{ base: 'column', md: 'row' }}>
                <Flex align="center" gap="10px">
                  <Heading as="h2" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
                    All members ({group.memberships.length})
                  </Heading>
                  <Button size="sm" variant="secondary" leftIcon={<UserPlus size={13} />}
                    onClick={() => { setAddEmail(''); setAddOpen(true) }}>
                    Add student
                  </Button>
                </Flex>
                {group.memberships.length > 0 && (
                  <Flex gap="8px" align="center" wrap="wrap">
                    <Flex gap="4px">
                      {([
                        { v: 'name', label: 'Name' },
                        { v: 'accuracy', label: 'Accuracy' },
                        { v: 'lessons', label: 'Lessons' },
                      ] as const).map((o) => (
                        <NativeButton key={o.v} type="button" onClick={() => setSortKey(o.v)}
                          px="10px" h="30px" borderRadius="full" border="1px solid"
                          bg={sortKey === o.v ? 'accent.surface' : 'bg.subtle'}
                          color={sortKey === o.v ? 'accent.text' : 'text.secondary'}
                          borderColor={sortKey === o.v ? 'border.accent' : 'border.subtle'}
                          fontSize="xs" fontWeight="medium" cursor="pointer">
                          {o.label}
                        </NativeButton>
                      ))}
                    </Flex>
                    <Box w="180px">
                      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" />
                    </Box>
                  </Flex>
                )}
              </Flex>
              <Card padding="tight">
                <Stack gap="0" maxH="62vh" overflowY="auto">
                  {members.map((m, idx) => {
                    const fullName = `${m.user.firstName}${m.user.lastName ? ` ${m.user.lastName}` : ''}`
                    const st = m.stats
                    return (
                      <Flex
                        key={m.user.id}
                        align="center"
                        gap="12px"
                        wrap="wrap"
                        py="12px"
                        px="12px"
                        borderTop={idx === 0 ? 'none' : '1px solid'}
                        borderColor="border.subtle"
                      >
                        <Flex align="center" gap="12px" flex="1" minW="0">
                          <Avatar size="sm" name={fullName} src={m.user.avatarUrl} />
                          <Box flex="1" minW="0">
                            <Flex align="center" gap="8px" wrap="wrap">
                              <Text fontSize="sm" fontWeight="medium" lineHeight="tight" truncate>
                                {fullName}
                              </Text>
                              {st?.needsAttention && (
                                <Badge tone="error" intensity="subtle" shape="pill">needs attention</Badge>
                              )}
                            </Flex>
                            <Text fontSize="xs" color="text.tertiary" truncate>
                              last active {formatLastActive(m.user.lastActiveDate)}
                            </Text>
                          </Box>
                        </Flex>
                        <Flex
                          gap="12px"
                          align="center"
                          justify={{ base: 'space-between', sm: 'flex-end' }}
                          w={{ base: '100%', sm: 'auto' }}
                          flexShrink={0}
                        >
                          <Flex gap="16px" align="center" fontSize="sm">
                            <Stack gap="0" textAlign="right" minW="52px">
                              <Text fontFamily="mono" color="accent.text">{st?.accuracyPercent ?? 0}%</Text>
                              <Text fontSize="xs" color="text.tertiary">accuracy</Text>
                            </Stack>
                            <Stack gap="0" textAlign="right" minW="56px" display={{ base: 'none', sm: 'flex' }}>
                              <Text fontFamily="mono">{st?.completedLessons ?? 0}</Text>
                              <Text fontSize="xs" color="text.tertiary">lessons</Text>
                            </Stack>
                          </Flex>
                          <Flex gap="4px" flexShrink={0}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                navigate(`/teach/groups/${id}/students/${m.user.id}`)
                              }
                            >
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              leftIcon={<UserMinus size={12} />}
                              onClick={() => setPendingKick(m.user.id)}
                            >
                              Remove
                            </Button>
                          </Flex>
                        </Flex>
                      </Flex>
                    )
                  })}
                  {group.memberships.length === 0 && (
                    <Box p="20px" textAlign="center">
                      <Text fontSize="sm" color="text.tertiary">
                        No members yet — share the invite code.
                      </Text>
                    </Box>
                  )}
                  {group.memberships.length > 0 && members.length === 0 && (
                    <Box p="20px" textAlign="center">
                      <Text fontSize="sm" color="text.tertiary">No one matches “{search}”.</Text>
                    </Box>
                  )}
                </Stack>
              </Card>
            </Stack>
          </motion.div>
        </motion.div>
      </Container>

      <Dialog
        open={editing}
        onOpenChange={setEditing}
        title="Edit group"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={updateMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}
              disabled={editName.trim().length < 3}>
              Save changes
            </Button>
          </>
        }
      >
        <Stack gap="12px">
          <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)}
            placeholder="IELTS Prep Spring 2026" />
          <Input label="Description (optional)" value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
            placeholder="What is this group for?" />
        </Stack>
      </Dialog>

      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add student"
        description="Enter the email the student signed up with. They'll be added to this group right away."
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)} disabled={addMemberMutation.isPending}>
              Done
            </Button>
            <Button
              onClick={() => addMemberMutation.mutate(
                { email: addEmail.trim() },
                { onSuccess: () => { setAddEmail(''); setAddOpen(false) } },
              )}
              loading={addMemberMutation.isPending}
              disabled={!addEmail.includes('@')}
            >
              Add by email
            </Button>
          </>
        }
      >
        <Stack gap="14px">
          <Input label="Student email" type="email" value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)} placeholder="student@example.com" />

          {(() => {
            const inGroup = new Set(group.memberships.map((m) => m.user.id))
            const candidates = (allStudentsQuery.data ?? []).filter((r) => !inGroup.has(r.user.id))
            if (candidates.length === 0) return null
            return (
              <Box>
                <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase" mb="6px">
                  Or pick from your students
                </Text>
                <Flex gap="6px" wrap="wrap">
                  {candidates.map((r) => {
                    const name = `${r.user.firstName}${r.user.lastName ? ` ${r.user.lastName}` : ''}`
                    return (
                      <Button key={r.user.id} size="sm" variant="secondary"
                        loading={addMemberMutation.isPending && addMemberMutation.variables?.userId === r.user.id}
                        onClick={() => addMemberMutation.mutate({ userId: r.user.id })}>
                        {name}
                      </Button>
                    )
                  })}
                </Flex>
              </Box>
            )
          })()}
        </Stack>
      </Dialog>

      <Dialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete group?"
        description="All memberships will be removed. Students keep their progress."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={deleteMutation.isPending}
              onClick={() => {
                setConfirmDelete(false)
                deleteMutation.mutate()
              }}
            >
              Delete group
            </Button>
          </>
        }
      />

      <Dialog
        open={Boolean(pendingKick)}
        onOpenChange={(open) => !open && setPendingKick(null)}
        title="Remove student?"
        description="They lose access to this group but keep their personal progress."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingKick(null)} disabled={removeMemberMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={removeMemberMutation.isPending}
              onClick={() => pendingKick && removeMemberMutation.mutate(pendingKick)}
            >
              Remove
            </Button>
          </>
        }
      />
    </Box>
  )
}

function StatTile({
  label, value, icon, tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone?: string
}) {
  return (
    <Card padding="comfortable">
      <Stack gap="8px">
        <Flex justify="space-between" align="center">
          <Text fontSize="xs" color="text.tertiary" letterSpacing="wide" textTransform="uppercase">
            {label}
          </Text>
          {icon && (
            <Box color={tone ?? 'text.tertiary'} display="inline-flex">
              {icon}
            </Box>
          )}
        </Flex>
        <Text fontSize="2xl" fontWeight="semibold" lineHeight="none" fontFamily="mono">
          {value}
        </Text>
      </Stack>
    </Card>
  )
}

function formatLastActive(date: string | null): string {
  if (!date) return 'never'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return 'never'
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} wk ago`
  return `${Math.floor(days / 30)} mo ago`
}

function WeeklyBars({ data }: { data: Array<{ day: string; submissions: number }> }) {
  const max = Math.max(1, ...data.map((d) => d.submissions))
  return (
    <Flex align="flex-end" justify="space-between" gap="8px" h="120px">
      {data.map((d, i) => (
        <Stack key={i} gap="6px" flex="1" align="center" justify="flex-end" h="100%">
          <Text fontSize="xs" color="text.tertiary" fontFamily="mono">{d.submissions}</Text>
          <Box w="100%" maxW="36px" h={`${Math.round((d.submissions / max) * 84)}px`}
            minH="3px" bg="accent.solid" borderRadius="sm" />
          <Text fontSize="xs" color="text.tertiary">{d.day}</Text>
        </Stack>
      ))}
    </Flex>
  )
}

function DetailSkeleton() {
  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1000px" py="32px">
        <Stack gap="20px">
          <Skeleton h="160px" borderRadius="xl" />
          <Skeleton h="100px" borderRadius="lg" />
          <Skeleton h="240px" borderRadius="lg" />
        </Stack>
      </Container>
    </Box>
  )
}
