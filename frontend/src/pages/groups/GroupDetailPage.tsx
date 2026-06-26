import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Box, Container, Flex, Heading, Stack, Text,
} from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ArrowLeft, Copy, Users, Flame, LogOut } from 'lucide-react'
import {
  Avatar, Badge, Button, Card, Link as RouterLink, Skeleton, showToast,
} from '@shared/ui'
import { groupsApi, extractApiError } from '@shared/api'
import { staggerContainer, fadeUp } from '@shared/motion'

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: ['groups', 'detail', id],
    queryFn: () => groupsApi.byId(id!),
    enabled: Boolean(id),
  })

  const leaveMutation = useMutation({
    mutationFn: () => groupsApi.leave(id!),
    onSuccess: async () => {
      showToast({ type: 'success', title: 'Left group' })
      await qc.invalidateQueries({ queryKey: ['groups', 'my'] })
      navigate('/groups')
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  if (query.isLoading) return <DetailSkeleton />
  if (query.isError) {
    return (
      <Box minH="100%" bg="bg.canvas">
        <Container maxW="900px" py="32px">
          <Card padding="comfortable">
            <Text fontSize="sm" color="error">{extractApiError(query.error)}</Text>
          </Card>
        </Container>
      </Box>
    )
  }
  if (!query.data) return <Navigate to="/groups" replace />

  const group = query.data
  const sortedMembers = [...group.memberships].sort(
    (a, b) => b.user.totalXp - a.user.totalXp,
  )

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
      <Container maxW="900px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="20px">
          <RouterLink
            to="/groups"
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="sm"
            color="text.tertiary"
            textDecoration="none"
            _hover={{ color: 'text.primary' }}
          >
            <ArrowLeft size={14} />
            All groups
          </RouterLink>
        </Box>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Card variant="hero" padding="spacious" style={{ marginBottom: 24 }}>
              <Stack gap="14px">
                <Flex gap="10px" wrap="wrap">
                  {group.isOwner ? (
                    <Badge tone="accent" intensity="solid">Owner</Badge>
                  ) : (
                    <Badge tone="neutral">Member</Badge>
                  )}
                  <Badge tone="neutral" leftIcon={<Users size={11} />} shape="pill">
                    {group.memberships.length} {group.memberships.length === 1 ? 'member' : 'members'}
                  </Badge>
                </Flex>
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
                {group.isOwner && group.inviteCode && (
                  <Flex
                    align="center"
                    gap="10px"
                    p="10px 12px"
                    bg="bg.subtle"
                    border="1px solid"
                    borderColor="border.subtle"
                    borderRadius="md"
                    maxW="320px"
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
                  </Flex>
                )}
                {!group.isOwner && (
                  <Flex>
                    <Button
                      variant="secondary"
                      leftIcon={<LogOut size={14} />}
                      onClick={() => leaveMutation.mutate()}
                      loading={leaveMutation.isPending}
                    >
                      Leave group
                    </Button>
                  </Flex>
                )}
              </Stack>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Stack gap="14px">
              <Heading as="h2" fontSize="lg" fontWeight="semibold" letterSpacing="tight">
                Class leaderboard
              </Heading>
              <Card padding="tight">
                <Stack gap="0">
                  {sortedMembers.map((m, idx) => (
                    <MemberRow
                      key={m.user.id}
                      rank={idx + 1}
                      name={`${m.user.firstName}${m.user.lastName ? ` ${m.user.lastName}` : ''}`}
                      avatarUrl={m.user.avatarUrl}
                      xp={m.user.totalXp}
                      streak={m.user.currentStreak}
                      isFirst={idx === 0}
                    />
                  ))}
                  {sortedMembers.length === 0 && (
                    <Box p="20px" textAlign="center">
                      <Text fontSize="sm" color="text.tertiary">
                        No members yet. Share the invite code.
                      </Text>
                    </Box>
                  )}
                </Stack>
              </Card>
            </Stack>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  )
}

function MemberRow({
  rank, name, avatarUrl, xp, streak, isFirst,
}: {
  rank: number
  name: string
  avatarUrl: string | null
  xp: number
  streak: number
  isFirst: boolean
}) {
  return (
    <Flex
      align="center"
      gap="12px"
      py="12px"
      px="12px"
      borderTop={isFirst ? 'none' : '1px solid'}
      borderColor="border.subtle"
    >
      <Box w="28px" textAlign="center" color="text.tertiary" fontFamily="mono" fontSize="sm">
        #{rank}
      </Box>
      <Avatar size="sm" name={name} src={avatarUrl} />
      <Box flex="1" minW="0">
        <Text fontSize="sm" fontWeight="medium" lineHeight="tight" truncate>
          {name}
        </Text>
      </Box>
      <Flex gap="14px" align="center" color="text.tertiary" fontSize="sm" flexShrink={0}>
        <Flex align="center" gap="4px" color="warning">
          <Flame size={12} fill="currentColor" />
          <Text fontFamily="mono">{streak}</Text>
        </Flex>
        <Flex align="center" gap="4px" color="accent.text">
          <Text fontFamily="mono" fontWeight="semibold">{xp.toLocaleString()}</Text>
          <Text fontSize="xs">XP</Text>
        </Flex>
      </Flex>
    </Flex>
  )
}

function DetailSkeleton() {
  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="900px" py="32px">
        <Stack gap="20px">
          <Skeleton h="200px" borderRadius="xl" />
          <Stack gap="8px">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} h="56px" borderRadius="md" />
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}
