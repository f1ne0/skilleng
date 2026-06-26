import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { Trophy, Target, Globe, Camera } from 'lucide-react'
import { format, isValid } from 'date-fns'
import { Avatar, Badge, Card, NativeButton, showToast } from '@shared/ui'
import { GOALS, LANGUAGES, useAuthStore } from '@entities/user'
import type { User } from '@entities/user'
import { uploadsApi, usersApi, extractApiError } from '@shared/api'

const LEVEL_LABEL: Record<string, string> = {
  A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate',
  B2: 'Upper-intermediate', C1: 'Advanced', C2: 'Mastery',
}

function safeFormat(input: string | null | undefined, pattern: string): string | null {
  if (!input) return null
  const d = new Date(input)
  return isValid(d) ? format(d, pattern) : null
}

export function ProfileHeader({ user }: { user: User }) {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const setUser = useAuthStore((s) => s.setUser)
  const [hover, setHover] = useState(false)

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const publicUrl = await uploadsApi.uploadFile(file, 'AVATAR')
      return usersApi.updateMe({ avatarUrl: publicUrl })
    },
    onSuccess: (updated) => {
      setUser(updated)
      showToast({ type: 'success', title: 'Avatar updated' })
    },
    onError: (err) => {
      showToast({ type: 'error', title: extractApiError(err) })
    },
  })

  const goal = user.goal ? GOALS.find((g) => g.goal === user.goal) : undefined
  const lang = user.nativeLanguage
    ? LANGUAGES.find((l) => l.code === user.nativeLanguage)
    : undefined
  const fullName = `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`

  const handlePickFile = () => {
    fileRef.current?.click()
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadMutation.mutate(file)
    e.target.value = ''
  }

  return (
    <Card variant="hero" padding="spacious">
      <Flex direction={{ base: 'column', md: 'row' }} gap="24px" align={{ base: 'flex-start', md: 'center' }}>
        <Box
          position="relative"
          flexShrink={0}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <Avatar size="xl" name={fullName} src={user.avatarUrl} ring />
          <NativeButton
            type="button"
            aria-label="Change avatar"
            onClick={handlePickFile}
            disabled={uploadMutation.isPending}
            position="absolute"
            inset="0"
            display={hover || uploadMutation.isPending ? 'flex' : 'none'}
            alignItems="center"
            justifyContent="center"
            borderRadius="full"
            bg="rgba(0,0,0,0.5)"
            color="white"
            border="none"
            cursor={uploadMutation.isPending ? 'wait' : 'pointer'}
          >
            <Camera size={20} />
          </NativeButton>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <Box
            position="absolute"
            right="2px"
            bottom="2px"
            w="14px"
            h="14px"
            borderRadius="full"
            bg="accent.solid"
            border="3px solid"
            borderColor="bg.surface"
            pointerEvents="none"
          />
        </Box>

        <Stack gap="10px" flex="1" minW="0">
          <Box>
            <Flex align="center" gap="10px" wrap="wrap">
              <Text
                fontSize={{ base: '2xl', md: '3xl' }}
                fontWeight="semibold"
                letterSpacing="tight"
                lineHeight="tight"
              >
                {fullName}
              </Text>
              <Badge tone="neutral">{user.role === 'TEACHER' ? 'Teacher' : 'Student'}</Badge>
              {user.emailVerified && (
                <Badge tone="success" intensity="subtle">
                  Verified
                </Badge>
              )}
            </Flex>
            <Text fontSize="sm" color="text.tertiary" mt="2px">
              {user.email}
            </Text>
          </Box>

          {user.role !== 'TEACHER' && (
            <Flex gap="8px" wrap="wrap">
              {user.level && (
                <Badge tone="accent" intensity="solid" shape="pill" leftIcon={<Trophy size={12} />}>
                  {user.level} · {LEVEL_LABEL[user.level]}
                </Badge>
              )}
              {goal && (
                <Badge tone="neutral" shape="pill" leftIcon={<Target size={12} />}>
                  {goal.title}
                </Badge>
              )}
              {lang && (
                <Badge tone="neutral" shape="pill" leftIcon={<Globe size={12} />}>
                  {lang.name}
                </Badge>
              )}
            </Flex>
          )}

          {user.bio && (
            <Text fontSize="sm" color="text.secondary" lineHeight="relaxed" maxW="640px">
              {user.bio}
            </Text>
          )}

          {(safeFormat(user.createdAt, 'MMMM yyyy') || user.lastLoginAt) && (
            <Text fontSize="xs" color="text.tertiary">
              {safeFormat(user.createdAt, 'MMMM yyyy') &&
                `Member since ${safeFormat(user.createdAt, 'MMMM yyyy')}`}
              {safeFormat(user.lastLoginAt, 'd MMM, HH:mm') &&
                ` · last seen ${safeFormat(user.lastLoginAt, 'd MMM, HH:mm')}`}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}
