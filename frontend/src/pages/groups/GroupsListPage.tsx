import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { Users, ArrowRight, KeyRound } from 'lucide-react'
import { Badge, Button, Card, Input, Skeleton, showToast } from '@shared/ui'
import { groupsApi, extractApiError } from '@shared/api'
import type { GroupSummary } from '@shared/api'
import { staggerContainer, fadeUp } from '@shared/motion'

export function GroupsListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [inviteCode, setInviteCode] = useState('')

  const myQuery = useQuery({
    queryKey: ['groups', 'my'],
    queryFn: groupsApi.my,
  })

  const joinMutation = useMutation({
    mutationFn: (code: string) => groupsApi.join(code),
    onSuccess: async (res) => {
      showToast({ type: 'success', title: `Joined ${res.group.name}` })
      setInviteCode('')
      await qc.invalidateQueries({ queryKey: ['groups', 'my'] })
      navigate(`/groups/${res.group.id}`)
    },
    onError: (err) => {
      showToast({ type: 'error', title: extractApiError(err) })
    },
  })

  const allGroups: GroupSummary[] = [
    ...(myQuery.data?.owned ?? []),
    ...(myQuery.data?.member ?? []),
  ]

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1100px" py="32px" px={{ base: '20px', md: '32px' }}>
        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Stack gap="6px" mb="28px">
              <Heading
                as="h1"
                fontSize={{ base: '3xl', md: '4xl' }}
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="tight"
              >
                Groups
              </Heading>
              <Text fontSize="md" color="text.secondary">
                Learn with your class or join a teacher's group.
              </Text>
            </Stack>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card padding="comfortable" style={{ marginBottom: 24 }}>
              <Flex
                gap="12px"
                align={{ base: 'stretch', md: 'flex-end' }}
                direction={{ base: 'column', md: 'row' }}
              >
                <Box flex="1">
                  <Input
                    label="Have an invite code?"
                    placeholder="6-character code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    leftIcon={<KeyRound size={14} />}
                  />
                </Box>
                <Button
                  size="md"
                  onClick={() => joinMutation.mutate(inviteCode.trim())}
                  disabled={inviteCode.trim().length !== 6}
                  loading={joinMutation.isPending}
                >
                  Join group
                </Button>
              </Flex>
            </Card>
          </motion.div>

          {myQuery.isLoading ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="14px">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} h="140px" borderRadius="lg" />
              ))}
            </SimpleGrid>
          ) : allGroups.length === 0 ? (
            <Card padding="spacious">
              <Stack gap="6px" align="center" textAlign="center" py="20px">
                <Box color="text.tertiary"><Users size={24} /></Box>
                <Text fontSize="md" fontWeight="semibold">No groups yet</Text>
                <Text fontSize="sm" color="text.secondary">
                  Ask your teacher for an invite code to join their class.
                </Text>
              </Stack>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="14px">
              {allGroups.map((g) => (
                <GroupCard key={g.id} group={g} onOpen={() => navigate(`/groups/${g.id}`)} />
              ))}
            </SimpleGrid>
          )}
        </motion.div>
      </Container>
    </Box>
  )
}

function GroupCard({ group, onOpen }: { group: GroupSummary; onOpen: () => void }) {
  const memberCount = group._count?.memberships ?? 0
  return (
    <Card interactive padding="comfortable" onClick={onOpen}>
      <Stack gap="10px">
        <Flex justify="space-between" align="flex-start" gap="10px">
          <Stack gap="4px" flex="1" minW="0">
            <Text fontSize="md" fontWeight="semibold" lineHeight="tight" truncate>
              {group.name}
            </Text>
            {group.description && (
              <Text fontSize="sm" color="text.secondary" lineHeight="normal">
                {group.description}
              </Text>
            )}
          </Stack>
          <Badge
            tone={group.role === 'OWNER' ? 'accent' : 'neutral'}
            intensity={group.role === 'OWNER' ? 'solid' : 'subtle'}
            shape="pill"
          >
            {group.role === 'OWNER' ? 'Owner' : 'Member'}
          </Badge>
        </Flex>
        <Flex justify="space-between" align="center" color="text.tertiary" fontSize="xs">
          <Flex align="center" gap="4px">
            <Users size={12} />
            <span>{memberCount} {memberCount === 1 ? 'member' : 'members'}</span>
          </Flex>
          <Flex align="center" gap="4px" color="accent.text">
            Open
            <ArrowRight size={12} />
          </Flex>
        </Flex>
      </Stack>
    </Card>
  )
}
