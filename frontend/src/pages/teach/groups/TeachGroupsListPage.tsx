import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Box, Container, Flex, Heading, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Plus, Users, Copy } from 'lucide-react'
import {
  Badge, Button, Card, Dialog, Input, Link as RouterLink, Skeleton, showToast,
} from '@shared/ui'
import { groupsApi, extractApiError } from '@shared/api'
import { staggerContainer, fadeUp } from '@shared/motion'

export function TeachGroupsListPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const query = useQuery({
    queryKey: ['groups', 'my'],
    queryFn: groupsApi.my,
  })

  const createMutation = useMutation({
    mutationFn: () => groupsApi.create({ name: name.trim(), description: description.trim() || undefined }),
    onSuccess: async (created) => {
      showToast({ type: 'success', title: 'Group created' })
      setCreating(false)
      setName('')
      setDescription('')
      await qc.invalidateQueries({ queryKey: ['groups', 'my'] })
      navigate(`/teach/groups/${created.id}`)
    },
    onError: (err) => showToast({ type: 'error', title: extractApiError(err) }),
  })

  const owned = query.data?.owned ?? []

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      showToast({ type: 'success', title: 'Invite code copied' })
    } catch {
      showToast({ type: 'error', title: 'Could not copy' })
    }
  }

  return (
    <Box minH="100%" bg="bg.canvas">
      <Container maxW="1100px" py="32px" px={{ base: '20px', md: '32px' }}>
        <Box mb="14px">
          <RouterLink
            to="/teach"
            display="inline-flex"
            alignItems="center"
            gap="6px"
            fontSize="sm"
            color="text.tertiary"
            textDecoration="none"
            _hover={{ color: 'text.primary' }}
          >
            <ArrowLeft size={14} />
            Teach
          </RouterLink>
        </Box>

        <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
          <motion.div variants={fadeUp}>
            <Flex
              align={{ base: 'flex-start', md: 'center' }}
              justify="space-between"
              gap="14px"
              mb="20px"
              direction={{ base: 'column', md: 'row' }}
            >
              <Stack gap="6px">
                <Heading
                  as="h1"
                  fontSize={{ base: '3xl', md: '4xl' }}
                  fontWeight="semibold"
                  letterSpacing="tight"
                  lineHeight="tight"
                >
                  Your groups
                </Heading>
                <Text fontSize="md" color="text.secondary">
                  Invite students and track their progress.
                </Text>
              </Stack>
              <Button leftIcon={<Plus size={14} />} onClick={() => setCreating(true)}>
                New group
              </Button>
            </Flex>
          </motion.div>

          {query.isLoading ? (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="14px">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} h="120px" borderRadius="lg" />
              ))}
            </SimpleGrid>
          ) : owned.length === 0 ? (
            <Card padding="spacious">
              <Stack gap="6px" align="center" textAlign="center" py="24px">
                <Box color="text.tertiary"><Users size={22} /></Box>
                <Text fontSize="md" fontWeight="semibold">No groups yet</Text>
                <Text fontSize="sm" color="text.secondary">
                  Create a group and share the invite code with your students.
                </Text>
              </Stack>
            </Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap="14px">
              {owned.map((g) => (
                <Card
                  key={g.id}
                  interactive
                  padding="comfortable"
                  onClick={() => navigate(`/teach/groups/${g.id}`)}
                >
                  <Stack gap="10px">
                    <Flex justify="space-between" align="flex-start" gap="10px">
                      <Stack gap="4px" flex="1" minW="0">
                        <Text fontSize="md" fontWeight="semibold" lineHeight="tight" truncate>
                          {g.name}
                        </Text>
                        {g.description && (
                          <Text fontSize="sm" color="text.secondary" lineHeight="normal">
                            {g.description}
                          </Text>
                        )}
                      </Stack>
                      <Badge tone="accent" intensity="solid" shape="pill">
                        Owner
                      </Badge>
                    </Flex>
                    <Flex justify="space-between" align="center" color="text.tertiary" fontSize="xs">
                      <Flex align="center" gap="4px">
                        <Users size={12} />
                        <span>{g._count?.memberships ?? 0} members</span>
                      </Flex>
                      <Flex align="center" gap="4px" color="accent.text">
                        Open
                        <ArrowRight size={12} />
                      </Flex>
                    </Flex>
                    {g.inviteCode && (
                      <Flex align="center" gap="8px" pt="2px"
                        onClick={(e) => e.stopPropagation()}>
                        <Text fontSize="xs" color="text.tertiary" textTransform="uppercase" letterSpacing="wide">
                          Invite
                        </Text>
                        <Text fontFamily="mono" fontSize="sm" fontWeight="semibold" letterSpacing="wider">
                          {g.inviteCode}
                        </Text>
                        <Button size="sm" variant="ghost" leftIcon={<Copy size={12} />}
                          onClick={() => copyCode(g.inviteCode!)}>
                          Copy
                        </Button>
                      </Flex>
                    )}
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </motion.div>
      </Container>

      <Dialog
        open={creating}
        onOpenChange={setCreating}
        title="New group"
        description="Pick a recognizable name. You can change it later."
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreating(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={name.trim().length < 3}
              loading={createMutation.isPending}
            >
              Create
            </Button>
          </>
        }
      >
        <Stack gap="12px">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="IELTS Prep Spring 2026"
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group for?"
          />
        </Stack>
      </Dialog>
    </Box>
  )
}
