import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { LogOut, AlertTriangle, Trash2 } from 'lucide-react'
import { Button, Card, Dialog, showToast } from '@shared/ui'
import { authApi, usersApi, extractApiError } from '@shared/api'
import { useAuthStore } from '@entities/user'

export function DangerZone() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const logout = useAuthStore((s) => s.logout)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        // refresh-токен в httpOnly-куке — сервер сам её прочитает и очистит
        await authApi.logout()
      } catch {
        // Best-effort revocation — proceed with local logout regardless.
      }
    },
    onSettled: () => {
      logout()
      qc.clear()
      showToast({ type: 'info', title: "You've signed out." })
      navigate('/login', { replace: true })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteAccount,
    onSuccess: () => {
      logout()
      qc.clear()
      showToast({ type: 'success', title: 'Account deleted' })
      navigate('/login', { replace: true })
    },
    onError: (err) => {
      showToast({ type: 'error', title: extractApiError(err) })
    },
  })

  return (
    <>
      <Card padding="spacious" style={{ borderColor: 'var(--se-colors-error)' }}>
        <Stack gap="20px">
          <Flex align="flex-start" gap="14px">
            <Box
              w="36px"
              h="36px"
              borderRadius="md"
              bg="rgba(244,63,94,0.10)"
              color="error"
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <AlertTriangle size={18} />
            </Box>
            <Box flex="1">
              <Text fontSize="lg" fontWeight="semibold" letterSpacing="tight" lineHeight="tight">
                Danger zone
              </Text>
              <Text fontSize="sm" color="text.secondary" mt="2px">
                Account-level actions you'll want to think about twice.
              </Text>
            </Box>
          </Flex>

          <Stack gap="0">
            <DangerRow
              title="Sign out"
              description="End this session on this device. Your progress is safe."
              action={
                <Button
                  variant="secondary"
                  leftIcon={<LogOut size={14} />}
                  onClick={() => logoutMutation.mutate()}
                  loading={logoutMutation.isPending}
                >
                  Sign out
                </Button>
              }
            />
            <DangerRow
              title="Delete account"
              description="Permanently erase your profile, progress, vocabulary and history."
              action={
                <Button
                  variant="destructive"
                  leftIcon={<Trash2 size={14} />}
                  onClick={() => setConfirmDelete(true)}
                >
                  Delete account
                </Button>
              }
            />
          </Stack>
        </Stack>
      </Card>

      <Dialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete your account?"
        description="This action is permanent. Your progress, streaks, vocabulary and chat history will be lost."
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={deleteMutation.isPending}
            >
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
              Yes, delete forever
            </Button>
          </>
        }
      >
        <Text fontSize="sm" color="text.secondary">
          If you just need a break — sign out instead. Your account will wait for you.
        </Text>
      </Dialog>
    </>
  )
}

function DangerRow({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <Flex
      align={{ base: 'flex-start', md: 'center' }}
      justify="space-between"
      gap="16px"
      py="16px"
      direction={{ base: 'column', md: 'row' }}
      borderTop="1px solid"
      borderColor="border.subtle"
      _first={{ borderTop: 'none', pt: 0 }}
    >
      <Box>
        <Text fontSize="sm" fontWeight="semibold" color="text.primary">
          {title}
        </Text>
        <Text fontSize="sm" color="text.secondary" mt="2px">
          {description}
        </Text>
      </Box>
      <Box flexShrink={0}>{action}</Box>
    </Flex>
  )
}
